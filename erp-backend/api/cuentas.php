<?php
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET — listar todas las cuentas (sin duplicados, ordenadas)
if ($method === 'GET') {
    $res = $db->query("
        SELECT id_cuenta, codigo, nombre_cuenta, tipo
        FROM cuentas_contables
        ORDER BY codigo ASC
    ");
    $cuentas = [];
    while ($row = $res->fetch_assoc()) $cuentas[] = $row;
    echo json_encode($cuentas);
    $db->close();
    exit;
}

// POST — crear nueva cuenta
if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);

    if (empty($b['codigo']) || empty($b['nombre_cuenta']) || empty($b['tipo'])) {
        echo json_encode(['ok' => false, 'mensaje' => 'Código, nombre y tipo son obligatorios.']);
        exit;
    }

    $codigo = $db->real_escape_string(trim($b['codigo']));
    $nombre = $db->real_escape_string(trim($b['nombre_cuenta']));
    $tipo   = $db->real_escape_string(trim($b['tipo']));

    // Verificar que el código no exista
    $check = $db->query("SELECT id_cuenta FROM cuentas_contables WHERE codigo = '$codigo' LIMIT 1");
    if ($check && $check->num_rows > 0) {
        echo json_encode(['ok' => false, 'mensaje' => "El código '$codigo' ya existe."]);
        $db->close();
        exit;
    }

    $db->query("INSERT INTO cuentas_contables (codigo, nombre_cuenta, tipo) VALUES ('$codigo','$nombre','$tipo')");
    echo json_encode(['ok' => true, 'id' => $db->insert_id]);
    $db->close();
    exit;
}

// DELETE — eliminar cuenta (solo si no tiene movimientos)
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['ok' => false, 'mensaje' => 'ID requerido']); exit; }

    // Verificar que no tenga movimientos
    $check = $db->query("SELECT COUNT(*) AS total FROM libro_diario WHERE id_cuenta = $id");
    $total = $check ? (int)$check->fetch_assoc()['total'] : 0;
    if ($total > 0) {
        echo json_encode(['ok' => false, 'mensaje' => 'No se puede eliminar, la cuenta tiene movimientos registrados.']);
        $db->close();
        exit;
    }

    $db->query("DELETE FROM cuentas_contables WHERE id_cuenta = $id");
    echo json_encode(['ok' => true]);
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
