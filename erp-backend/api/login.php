<?php
ob_start(); // Captura cualquier output extra antes del JSON

require_once '../config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    http_response_code(405);
    echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
    exit;
}

$body    = json_decode(file_get_contents('php://input'), true);
$usuario = isset($body['usuario'])  ? trim($body['usuario']) : '';
$password= isset($body['password']) ? $body['password']      : '';
$rol     = isset($body['rol'])      ? trim($body['rol'])      : '';

if (!$usuario || !$password || !$rol) {
    ob_end_clean();
    echo json_encode(['ok' => false, 'mensaje' => 'Completa todos los campos.']);
    exit;
}

$db = getDB();

$usuarioEsc = $db->real_escape_string($usuario);
$rolEsc     = $db->real_escape_string($rol);

$res = $db->query("
    SELECT id_usuario, nombre, usuario, contraseña, rol
    FROM usuarios
    WHERE usuario = '$usuarioEsc' AND rol = '$rolEsc'
    LIMIT 1
");

if (!$res || $res->num_rows === 0) {
    ob_end_clean();
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario, contraseña o rol incorrecto.']);
    $db->close();
    exit;
}

$user = $res->fetch_assoc();

// Verificar contraseña — acepta texto plano y hash
$passOk = false;
if ($password === $user['contraseña']) {
    $passOk = true;
    // Hashear para próximos logins
    $hash = $db->real_escape_string(password_hash($password, PASSWORD_DEFAULT));
    $db->query("UPDATE usuarios SET contraseña='$hash' WHERE id_usuario={$user['id_usuario']}");
} elseif (password_verify($password, $user['contraseña'])) {
    $passOk = true;
}

if (!$passOk) {
    ob_end_clean();
    echo json_encode(['ok' => false, 'mensaje' => 'Usuario, contraseña o rol incorrecto.']);
    $db->close();
    exit;
}

ob_end_clean();
echo json_encode([
    'ok'      => true,
    'id'      => (int)$user['id_usuario'],
    'nombre'  => $user['nombre'],
    'usuario' => $user['usuario'],
    'rol'     => $user['rol'],
]);

$db->close();
