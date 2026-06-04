<?php
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET — listar usuarios
if ($method === 'GET') {
    $res = $db->query("SELECT id_usuario, nombre, usuario, rol FROM usuarios ORDER BY id_usuario ASC");
    $usuarios = [];
    while ($row = $res->fetch_assoc()) $usuarios[] = $row;
    echo json_encode($usuarios);
    $db->close();
    exit;
}

// POST — crear usuario
if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);

    if (empty($b['nombre']) || empty($b['usuario']) || empty($b['password']) || empty($b['rol'])) {
        echo json_encode(['ok' => false, 'mensaje' => 'Todos los campos son obligatorios.']);
        exit;
    }

    // Verificar que el usuario no exista
    $usu = $db->real_escape_string($b['usuario']);
    $check = $db->query("SELECT id_usuario FROM usuarios WHERE usuario = '$usu' LIMIT 1");
    if ($check && $check->num_rows > 0) {
        echo json_encode(['ok' => false, 'mensaje' => "El usuario '$usu' ya existe."]);
        $db->close();
        exit;
    }

    $nombre = $db->real_escape_string($b['nombre']);
    $rol    = $db->real_escape_string($b['rol']);
    $hash   = password_hash($b['password'], PASSWORD_DEFAULT);
    $hash   = $db->real_escape_string($hash);

    $db->query("INSERT INTO usuarios (nombre, usuario, contrasena, rol) VALUES ('$nombre','$usu','$hash','$rol')");
    echo json_encode(['ok' => true, 'id' => $db->insert_id]);
    $db->close();
    exit;
}

// DELETE — eliminar usuario
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { echo json_encode(['ok' => false, 'mensaje' => 'ID requerido']); exit; }
    $db->query("DELETE FROM usuarios WHERE id_usuario = $id");
    echo json_encode(['ok' => true]);
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
