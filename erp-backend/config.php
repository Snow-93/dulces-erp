<?php
// ============================================================
//  Configuración de base de datos — Railway MySQL (variables de entorno)
// ============================================================
define('DB_HOST', getenv('MYSQLHOST') ?: 'mysql.ferrocarril.interno');
define('DB_NAME', getenv('BASE DE DATOS MYSQL') ?: getenv('MYSQLDATABASE') ?: 'railway');
define('DB_USER', getenv('USUARIO DE MYSQL') ?: getenv('MYSQLUSER') ?: 'root');
define('DB_PASS', getenv('CONTRASEÑA DE MYSQL') ?: getenv('MYSQLPASSWORD') ?: 'gkBvmZrlvPnWVTuGCUXSOoDUeUMLUrAL');
define('DB_PORT', (int)(getenv('Puerto MySQL') ?: getenv('MYSQLPORT') ?: 3306));

function getDB() {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($db->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => true, 'mensaje' => 'Error de conexión: ' . $db->connect_error]);
        exit;
    }
    $db->set_charset('utf8mb4');
    return $db;
}
