<?php
// ============================================================
//  api/login.php — Autenticación de usuarios
// ============================================================
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
    exit;
}

$body    = json_decode(file_get_contents('php://input'), true);
$usuario = $body['usuario'] ?? '';
$password= $body['password'] ?? '';
$rol     = $body['rol']     ?? '';

if (!$usuario || !$password || !$rol) {
    echo json_encode(['ok' => false, 'mensaje' => 'Completa todos los campos.']);
    exit;
}

$db = getDB();

$usuario  = $db->real_escape_string($usuario);
$rol      = $db->real_escape_string($rol);

// Buscar usuario por nombre de usuario y rol
$res = $db->query("
    SELECT id_usuario, nombre, usuario, contraseña, rol
    FROM usuarios
    WHERE usuario = '$usuario' AND rol = '$rol'
    LIMIT 1
");

if (!$res || $res->num_rows === 0) {
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario, contraseña o rol incorrecto.']);
    $db->close();
    exit;
}

$user = $res->fetch_assoc();

// Verificar contraseña (soporta texto plano y hash)
$passOk = false;
if (password_verify($password, $user['contraseña'])) {
    $passOk = true; // contraseña hasheada
} elseif ($password === $user['contraseña']) {
    $passOk = true; // contraseña en texto plano (para desarrollo)

    // Aprovechar para hashear la contraseña si estaba en texto plano
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $db->query("UPDATE usuarios SET contraseña='$hash' WHERE id_usuario={$user['id_usuario']}");
}

if (!$passOk) {
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario, contraseña o rol incorrecto.']);
    $db->close();
    exit;
}

echo json_encode([
    'ok'      => true,
    'id'      => $user['id_usuario'],
    'nombre'  => $user['nombre'],
    'usuario' => $user['usuario'],
    'rol'     => $user['rol'],
]);

$db->close();
