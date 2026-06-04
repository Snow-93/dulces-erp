<?php
// ============================================================
//  config.php — Conexión a MySQL (XAMPP)
//  Dulces y Delicias del Valle, S.A. · ERP 2026
// ============================================================

// Suprimir warnings de PHP para que no rompan el JSON
error_reporting(0);
ini_set('display_errors', 0);

define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // usuario XAMPP por defecto
define('DB_PASS', '');           // contraseña XAMPP por defecto (vacía)
define('DB_NAME', 'sweet_spot');

function getDB(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode([
            'error'   => true,
            'mensaje' => 'Error de conexión: ' . $conn->connect_error
        ]));
    }
    $conn->set_charset('utf8mb4');
    return $conn;
}

// Headers CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
