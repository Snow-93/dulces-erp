<?php
// ============================================================
//  balance_saldos.php — Calculado desde libro_diario
//  ?tipo=saldos    → Balance de Saldos
//  ?tipo=ajustado  → Balance Ajustado
// ============================================================
require_once '../config.php';

$db   = getDB();
$tipo = $_GET['tipo'] ?? 'saldos';

$cuentas = [];

$res = $db->query("
    SELECT
        cc.codigo,
        cc.nombre_cuenta,
        cc.tipo,
        COALESCE(SUM(ld.debe),  0) AS total_debe,
        COALESCE(SUM(ld.haber), 0) AS total_haber
    FROM cuentas_contables cc
    LEFT JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta
    GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta, cc.tipo
    HAVING total_debe > 0 OR total_haber > 0
    ORDER BY cc.codigo ASC
");

$sum_debe = $sum_haber = $sum_sd = $sum_sa = 0;

while ($row = $res->fetch_assoc()) {
    $debe  = (float)$row['total_debe'];
    $haber = (float)$row['total_haber'];

    if (in_array($row['tipo'], ['ACTIVO', 'GASTO'])) {
        $sd = max($debe - $haber, 0);
        $sa = 0;
    } else {
        $sd = 0;
        $sa = max($haber - $debe, 0);
    }

    $sum_debe  += $debe;
    $sum_haber += $haber;
    $sum_sd    += $sd;
    $sum_sa    += $sa;

    $entry = [
        'codigo'         => $row['codigo'],
        'nombre_cuenta'  => $row['nombre_cuenta'],
        'tipo'           => $row['tipo'],
        'total_debe'     => $debe,
        'total_haber'    => $haber,
        'saldo_deudor'   => $sd,
        'saldo_acreedor' => $sa,
    ];

    if ($tipo === 'ajustado') {
        // Obtener ajustes de la tabla ajustes
        $resA = $db->query("SELECT COALESCE(SUM(debe),0) AS d, COALESCE(SUM(haber),0) AS h FROM ajustes");
        $ajRow = $resA->fetch_assoc();
        $aj_debe  = 0;
        $aj_haber = 0;
        if ($row['tipo'] === 'GASTO')  $aj_debe  = round((float)$ajRow['d'] / 3, 2);
        if ($row['tipo'] === 'PASIVO') $aj_haber = round((float)$ajRow['h'] / 3, 2);

        $saldo_final = ($sd + $aj_debe) - ($sa + $aj_haber);

        $entry['ajuste_debe']   = $aj_debe;
        $entry['ajuste_haber']  = $aj_haber;
        $entry['saldo_final']   = $saldo_final;
        $entry['clasificacion'] = match($row['tipo']) {
            'ACTIVO', 'PASIVO', 'CAPITAL' => 'Balance General',
            'INGRESO', 'GASTO'            => 'Estado Resultados',
            default                       => '—'
        };
    }

    $cuentas[] = $entry;
}

echo json_encode([
    'cuentas' => $cuentas,
    'totales' => [
        'debe'           => $sum_debe,
        'haber'          => $sum_haber,
        'saldo_deudor'   => $sum_sd,
        'saldo_acreedor' => $sum_sa,
    ],
]);

$db->close();
