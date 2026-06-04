<?php
require_once '../config.php';

$db  = getDB();
$mes  = isset($_GET['mes'])  ? (int)$_GET['mes']  : (int)date('n');
$anio = isset($_GET['anio']) ? (int)$_GET['anio'] : (int)date('Y');

$filtro = "AND MONTH(ld.fecha) = $mes AND YEAR(ld.fecha) = $anio";
$filtroV = "AND MONTH(fecha) = $mes AND YEAR(fecha) = $anio";

// Ventas
$ventas = $db->query("
    SELECT COALESCE(SUM(ld.haber),0) AS total
    FROM libro_diario ld
    JOIN cuentas_contables cc ON ld.id_cuenta = cc.id_cuenta
    WHERE cc.codigo = '4101' $filtro
")->fetch_assoc()['total'];

// Costo de ventas
$costo = $db->query("
    SELECT COALESCE(SUM(ld.debe),0) AS total
    FROM libro_diario ld
    JOIN cuentas_contables cc ON ld.id_cuenta = cc.id_cuenta
    WHERE cc.codigo = '5101' $filtro
")->fetch_assoc()['total'];

// Gastos totales
$gastos = $db->query("
    SELECT COALESCE(SUM(ld.debe),0) AS total
    FROM libro_diario ld
    JOIN cuentas_contables cc ON ld.id_cuenta = cc.id_cuenta
    WHERE cc.tipo = 'GASTO' $filtro
")->fetch_assoc()['total'];

// Capital (acumulado, sin filtro de mes)
$capital = $db->query("
    SELECT COALESCE(SUM(ld.haber),0) AS total
    FROM libro_diario ld
    JOIN cuentas_contables cc ON ld.id_cuenta = cc.id_cuenta
    WHERE cc.codigo = '3101'
")->fetch_assoc()['total'];

// Empleados
$empleados = $db->query("SELECT COUNT(*) AS total FROM empleados")->fetch_assoc()['total'];
$planilla  = $db->query("SELECT COALESCE(SUM(salario),0) AS total FROM empleados")->fetch_assoc()['total'];

// Últimas partidas del período
$partidas = [];
$res = $db->query("
    SELECT id_partida, descripcion,
           COALESCE(SUM(debe),0)  AS total_debe,
           COALESCE(SUM(haber),0) AS total_haber
    FROM libro_diario
    WHERE MONTH(fecha) = $mes AND YEAR(fecha) = $anio
    GROUP BY id_partida, descripcion
    ORDER BY id_partida DESC
    LIMIT 9
");
if ($res) {
    while ($row = $res->fetch_assoc()) $partidas[] = $row;
}

// Meses con datos (para el selector)
$mesesRes = $db->query("
    SELECT DISTINCT MONTH(fecha) AS mes, YEAR(fecha) AS anio
    FROM libro_diario
    ORDER BY anio ASC, mes ASC
");
$mesesDisponibles = [];
if ($mesesRes) {
    while ($m = $mesesRes->fetch_assoc()) $mesesDisponibles[] = $m;
}

echo json_encode([
    'periodo'            => ['mes' => $mes, 'anio' => $anio],
    'ventas'             => (float)$ventas,
    'costo_ventas'       => (float)$costo,
    'utilidad_bruta'     => (float)$ventas - (float)$costo,
    'gastos_totales'     => (float)$gastos,
    'capital'            => (float)$capital,
    'empleados'          => (int)$empleados,
    'planilla'           => (float)$planilla,
    'partidas'           => $partidas,
    'meses_disponibles'  => $mesesDisponibles,
]);

$db->close();
