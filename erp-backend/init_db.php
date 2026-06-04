<?php
// Script para inicializar la base de datos
require_once __DIR__ . '/config.php';

$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($db->connect_error) {
    die("Error: " . $db->connect_error);
}
$db->set_charset('utf8mb4');

$sql = file_get_contents(__DIR__ . '/datos_iniciales.sql');

// Remover USE statements
$sql = preg_replace('/^USE\s+\w+;/mi', '', $sql);
$sql = preg_replace('/^TRUNCATE\s+TABLE\s+\w+;/mi', '', $sql);

$db->multi_query($sql);
do {
    if ($result = $db->store_result()) {
        $result->free();
    }
} while ($db->more_results() && $db->next_result());

echo "Base de datos inicializada correctamente";
$db->close();
