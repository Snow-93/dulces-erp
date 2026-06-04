<?php
require_once '../config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db   = getDB();
$mes  = isset($_GET['mes'])  ? (int)$_GET['mes']  : 0;
$anio = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;

$filtroWhere = ($mes && $anio) 
    ? "WHERE MONTH(ld.fecha)=$mes AND YEAR(ld.fecha)=$anio" 
    : "";

// 1. Obtener cuentas que tienen movimientos en el período (UNA VEZ cada cuenta)
$res = $db->query("
    SELECT
        cc.id_cuenta,
        cc.codigo,
        cc.nombre_cuenta,
        cc.tipo,
        COALESCE(SUM(ld.debe),  0) AS total_debe,
        COALESCE(SUM(ld.haber), 0) AS total_haber
    FROM cuentas_contables cc
    INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta
    $filtroWhere
    GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta, cc.tipo
    ORDER BY cc.codigo ASC
");

if (!$res) {
    echo json_encode(['error' => true, 'mensaje' => $db->error]);
    exit;
}

$cuentas = [];

while ($row = $res->fetch_assoc()) {
    $debe  = (float)$row['total_debe'];
    $haber = (float)$row['total_haber'];

    if (in_array($row['tipo'], ['ACTIVO', 'GASTO'])) {
        $saldo      = $debe - $haber;
        $naturaleza = 'DEUDOR';
    } else {
        $saldo      = $haber - $debe;
        $naturaleza = 'ACREEDOR';
    }

    // 2. Obtener movimientos individuales de esta cuenta en el período
    $filtroM = ($mes && $anio) 
        ? "AND MONTH(fecha)=$mes AND YEAR(fecha)=$anio" 
        : "";

    $resM = $db->query("
        SELECT
            id_partida,
            DATE_FORMAT(fecha,'%d/%m/%Y') AS fecha,
            descripcion,
            debe,
            haber
        FROM libro_diario
        WHERE id_cuenta = {$row['id_cuenta']} $filtroM
        ORDER BY id ASC
    ");

    $movimientos = [];
    if ($resM) {
        while ($m = $resM->fetch_assoc()) {
            $movimientos[] = [
                'partida'     => 'P-' . str_pad($m['id_partida'], 2, '0', STR_PAD_LEFT),
                'fecha'       => $m['fecha'],
                'descripcion' => $m['descripcion'],
                'debe'        => (float)$m['debe'],
                'haber'       => (float)$m['haber'],
            ];
        }
    }

    $cuentas[] = [
        'id_cuenta'      => (int)$row['id_cuenta'],
        'codigo'         => $row['codigo'],
        'nombre_cuenta'  => $row['nombre_cuenta'],
        'tipo'           => $row['tipo'],
        'naturaleza'     => $naturaleza,
        'total_debe'     => $debe,
        'total_haber'    => $haber,
        'saldo'          => abs($saldo),
        'saldo_deudor'   => $naturaleza === 'DEUDOR'   ? abs($saldo) : 0,
        'saldo_acreedor' => $naturaleza === 'ACREEDOR' ? abs($saldo) : 0,
        'movimientos'    => $movimientos,
    ];
}

echo json_encode($cuentas);
$db->close();
