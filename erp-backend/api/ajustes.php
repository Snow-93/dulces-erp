<?php
// ============================================================
//  api/ajustes.php — Registro y consulta de ajustes
// ============================================================
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $ajustes = [];
    $res = $db->query("SELECT *, DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha_fmt FROM ajustes ORDER BY id_ajuste ASC");
    while ($row = $res->fetch_assoc()) {
        $ajustes[] = $row;
    }

    // Depreciaciones (tabla dedicada)
    $deps = [];
    $resD = $db->query("SELECT * FROM depreciaciones ORDER BY id_depreciacion ASC");
    while ($d = $resD->fetch_assoc()) {
        $d['dep_mensual'] = round((float)$d['depreciacion_anual'] / 12, 2);
        $deps[] = $d;
    }

    $totalDep = array_sum(array_column($deps, 'dep_mensual'));

    echo json_encode([
        'ajustes'        => $ajustes,
        'depreciaciones' => $deps,
        'total_dep_mes'  => $totalDep,
    ]);
    $db->close();
    exit;
}

if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("INSERT INTO ajustes (fecha, descripcion, debe, haber) VALUES (?,?,?,?)");
    $stmt->bind_param('ssdd', $b['fecha'], $b['descripcion'], $b['debe'], $b['haber']);
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $db->insert_id]);
    $stmt->close();
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
