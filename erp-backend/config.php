<?php
define('DB_HOST', 'mysql.ferrocarril.interno');
define('DB_NAME', 'railway');
define('DB_USER', 'root');
define('DB_PASS', 'gkBvmZrlvPnWVTuGCUXSOoDUeUMLUrAL');
define('DB_PORT', 3306);

function getDB() {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
    if ($db->connect_error) {
        http_response_code(500);
        echo json_encode(['error' => true, 'mensaje' => 'Error: ' . $db->connect_error]);
        exit;
    }
    $db->set_charset('utf8mb4');
    return $db;
}
