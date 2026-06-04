<?php
// Mostrar todas las variables de entorno para debug
$host = getenv('MYSQLHOST') ?: getenv('MYSQL_HOST') ?: 'mysql.ferrocarril.interno';
$db   = getenv('BASE DE DATOS MYSQL') ?: getenv('MYSQLDATABASE') ?: getenv('MYSQL_DATABASE') ?: 'railway';
$user = getenv('USUARIO DE MYSQL') ?: getenv('MYSQLUSER') ?: getenv('MYSQL_USER') ?: 'root';
$pass = getenv('CONTRASEÑA DE MYSQL') ?: getenv('MYSQLPASSWORD') ?: getenv('MYSQL_PASSWORD') ?: 'gkBvmZrlvPnWVTuGCUXSOoDUeUMLUrAL';
$port = (int)(getenv('Puerto MySQL') ?: getenv('MYSQLPORT') ?: getenv('MYSQL_PORT') ?: 3306);

define('DB_HOST', $host);
define('DB_NAME', $db);
define('DB_USER', $user);
define('DB_PASS', $pass);
define('DB_PORT', $port);

function getDB() {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($db->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => true, 'mensaje' => 'Error: ' . $db->connect_error . ' HOST:' . DB_HOST]);
        exit;
    }
    $db->set_charset('utf8mb4');
    return $db;
}
