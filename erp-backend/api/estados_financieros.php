<?php
// ============================================================
//  estados_financieros.php
//  Genera Estado de Resultados y Balance General
//  siguiendo NIC 1 — Presentación de Estados Financieros
// ============================================================
require_once '../config.php';

$db   = getDB();
$mes  = isset($_GET['mes'])  ? (int)$_GET['mes']  : 0;
$anio = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;
$tipo = $_GET['tipo'] ?? 'resultados'; // resultados | balance

// Filtro de período
$filtro = ($mes && $anio) ? "AND MONTH(ld.fecha)=$mes AND YEAR(ld.fecha)=$anio" : "";

// ── Helper: obtener saldo de una cuenta por código ─────────
function getSaldo($db, $codigo, $filtro) {
    $codigo = $db->real_escape_string($codigo);
    $res = $db->query("
        SELECT
            cc.tipo,
            COALESCE(SUM(ld.debe),  0) AS total_debe,
            COALESCE(SUM(ld.haber), 0) AS total_haber
        FROM cuentas_contables cc
        LEFT JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.codigo = '$codigo'
        GROUP BY cc.tipo
        LIMIT 1
    ");
    if (!$res || $res->num_rows === 0) return 0;
    $row  = $res->fetch_assoc();
    $debe = (float)$row['total_debe'];
    $hab  = (float)$row['total_haber'];
    return in_array($row['tipo'], ['ACTIVO','GASTO']) ? ($debe - $hab) : ($hab - $debe);
}

// ── Helper: saldo total por tipo de cuenta ─────────────────
function getSaldoTipo($db, $tipo, $filtro) {
    $tipo = $db->real_escape_string($tipo);
    $res  = $db->query("
        SELECT
            cc.tipo,
            COALESCE(SUM(ld.debe),  0) AS total_debe,
            COALESCE(SUM(ld.haber), 0) AS total_haber
        FROM cuentas_contables cc
        LEFT JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = '$tipo'
        GROUP BY cc.tipo
        LIMIT 1
    ");
    if (!$res || $res->num_rows === 0) return 0;
    $row  = $res->fetch_assoc();
    $debe = (float)$row['total_debe'];
    $hab  = (float)$row['total_haber'];
    return in_array($tipo, ['ACTIVO','GASTO']) ? ($debe - $hab) : ($hab - $debe);
}

// ── Helper: obtener todas las cuentas de un tipo ───────────
function getCuentasPorTipo($db, $tipo, $filtro) {
    $tipo = $db->real_escape_string($tipo);
    $res  = $db->query("
        SELECT
            cc.codigo, cc.nombre_cuenta, cc.tipo,
            COALESCE(SUM(ld.debe),  0) AS total_debe,
            COALESCE(SUM(ld.haber), 0) AS total_haber
        FROM cuentas_contables cc
        INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = '$tipo'
        GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta, cc.tipo
        HAVING total_debe > 0 OR total_haber > 0
        ORDER BY cc.codigo ASC
    ");
    $cuentas = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $debe = (float)$row['total_debe'];
            $hab  = (float)$row['total_haber'];
            $saldo = in_array($row['tipo'], ['ACTIVO','GASTO']) ? ($debe - $hab) : ($hab - $debe);
            $cuentas[] = [
                'codigo'       => $row['codigo'],
                'nombre_cuenta'=> $row['nombre_cuenta'],
                'saldo'        => $saldo,
            ];
        }
    }
    return $cuentas;
}

// ════════════════════════════════════════════════════════════
//  ESTADO DE RESULTADOS (NIC 1 — Método de la Naturaleza)
// ════════════════════════════════════════════════════════════
if ($tipo === 'resultados') {

    $ingresos      = getCuentasPorTipo($db, 'INGRESO', $filtro);
    $costos        = getCuentasPorTipo($db, 'GASTO',   $filtro);

    $totalIngresos = array_sum(array_column($ingresos, 'saldo'));

    // Separar costo de ventas de gastos operativos y depreciaciones
    $costoVentas   = 0;
    $gastosOper    = [];
    $depreciaciones= [];
    $gastosImpuesto= [];

    foreach ($costos as $c) {
        if (str_starts_with($c['codigo'], '5')) {
            $costoVentas += $c['saldo'];
        } elseif (str_starts_with($c['codigo'], '62')) {
            $depreciaciones[] = $c;
        } else {
            $gastosOper[] = $c;
        }
    }

    $utilidadBruta = $totalIngresos - $costoVentas;

    $totalGastosOper = array_sum(array_column($gastosOper, 'saldo'));
    $totalDep        = array_sum(array_column($depreciaciones, 'saldo'));
    $utilidadOper    = $utilidadBruta - $totalGastosOper - $totalDep;

    // IVA desde ajustes
    $resIva = $db->query("SELECT COALESCE(SUM(debe),0) AS iva FROM ajustes WHERE descripcion LIKE '%IVA%'" . ($mes && $anio ? " AND MONTH(fecha)=$mes AND YEAR(fecha)=$anio" : ""));
    $iva    = $resIva ? (float)$resIva->fetch_assoc()['iva'] : 0;

    $utilidadNeta = $utilidadOper - $iva;

    // Ratios NIC 1
    $margenBruto  = $totalIngresos > 0 ? round(($utilidadBruta / $totalIngresos) * 100, 2) : 0;
    $margenOper   = $totalIngresos > 0 ? round(($utilidadOper  / $totalIngresos) * 100, 2) : 0;
    $margenNeto   = $totalIngresos > 0 ? round(($utilidadNeta  / $totalIngresos) * 100, 2) : 0;

    echo json_encode([
        'ingresos'        => $ingresos,
        'total_ingresos'  => $totalIngresos,
        'costo_ventas'    => $costoVentas,
        'utilidad_bruta'  => $utilidadBruta,
        'gastos_oper'     => $gastosOper,
        'total_gastos_oper' => $totalGastosOper,
        'depreciaciones'  => $depreciaciones,
        'total_dep'       => $totalDep,
        'utilidad_oper'   => $utilidadOper,
        'iva'             => $iva,
        'utilidad_neta'   => $utilidadNeta,
        'margen_bruto'    => $margenBruto,
        'margen_oper'     => $margenOper,
        'margen_neto'     => $margenNeto,
        'es_perdida'      => $utilidadNeta < 0,
    ]);
    $db->close();
    exit;
}

// ════════════════════════════════════════════════════════════
//  BALANCE GENERAL (NIC 1 — Corriente / No Corriente)
// ════════════════════════════════════════════════════════════
if ($tipo === 'balance') {

    // Activos corrientes (1101-1299)
    $activosCorrientes = [];
    $res = $db->query("
        SELECT cc.codigo, cc.nombre_cuenta,
               COALESCE(SUM(ld.debe),0)  AS d,
               COALESCE(SUM(ld.haber),0) AS h
        FROM cuentas_contables cc
        INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = 'ACTIVO' AND cc.codigo BETWEEN '1101' AND '1299'
        GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta
        HAVING d > 0 OR h > 0
        ORDER BY cc.codigo ASC
    ");
    if ($res) while ($r = $res->fetch_assoc())
        $activosCorrientes[] = ['codigo'=>$r['codigo'],'nombre'=>$r['nombre_cuenta'],'saldo'=>(float)$r['d']-(float)$r['h']];

    // Activos no corrientes (1501+) sin depreciaciones acumuladas
    $activosNoCorrientes = [];
    $depAcum = [];
    $res = $db->query("
        SELECT cc.codigo, cc.nombre_cuenta,
               COALESCE(SUM(ld.debe),0)  AS d,
               COALESCE(SUM(ld.haber),0) AS h
        FROM cuentas_contables cc
        INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = 'ACTIVO' AND cc.codigo >= '1500'
        GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta
        HAVING d > 0 OR h > 0
        ORDER BY cc.codigo ASC
    ");
    if ($res) {
        while ($r = $res->fetch_assoc()) {
            $saldo = (float)$r['d'] - (float)$r['h'];
            if (str_starts_with($r['codigo'], '15') && (int)$r['codigo'] >= 1510) {
                $depAcum[] = ['codigo'=>$r['codigo'],'nombre'=>$r['nombre_cuenta'],'saldo'=>$saldo];
            } else {
                $activosNoCorrientes[] = ['codigo'=>$r['codigo'],'nombre'=>$r['nombre_cuenta'],'saldo'=>$saldo];
            }
        }
    }

    // Pasivos corrientes
    $pasivosCorrientes = [];
    $res = $db->query("
        SELECT cc.codigo, cc.nombre_cuenta,
               COALESCE(SUM(ld.debe),0)  AS d,
               COALESCE(SUM(ld.haber),0) AS h
        FROM cuentas_contables cc
        INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = 'PASIVO'
        GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta
        HAVING d > 0 OR h > 0
        ORDER BY cc.codigo ASC
    ");
    if ($res) while ($r = $res->fetch_assoc())
        $pasivosCorrientes[] = ['codigo'=>$r['codigo'],'nombre'=>$r['nombre_cuenta'],'saldo'=>(float)$r['h']-(float)$r['d']];

    // Capital
    $capitalCuentas = [];
    $res = $db->query("
        SELECT cc.codigo, cc.nombre_cuenta,
               COALESCE(SUM(ld.debe),0)  AS d,
               COALESCE(SUM(ld.haber),0) AS h
        FROM cuentas_contables cc
        INNER JOIN libro_diario ld ON cc.id_cuenta = ld.id_cuenta $filtro
        WHERE cc.tipo = 'CAPITAL'
        GROUP BY cc.id_cuenta, cc.codigo, cc.nombre_cuenta
        HAVING d > 0 OR h > 0
        ORDER BY cc.codigo ASC
    ");
    if ($res) while ($r = $res->fetch_assoc())
        $capitalCuentas[] = ['codigo'=>$r['codigo'],'nombre'=>$r['nombre_cuenta'],'saldo'=>(float)$r['h']-(float)$r['d']];

    // Utilidad / Pérdida del período (desde Estado de Resultados)
    $totalIngresos  = getSaldoTipo($db, 'INGRESO', $filtro);
    $totalGastos    = getSaldoTipo($db, 'GASTO',   $filtro);
    $resIva         = $db->query("SELECT COALESCE(SUM(debe),0) AS iva FROM ajustes WHERE descripcion LIKE '%IVA%'" . ($mes && $anio ? " AND MONTH(fecha)=$mes AND YEAR(fecha)=$anio" : ""));
    $iva            = $resIva ? (float)$resIva->fetch_assoc()['iva'] : 0;
    $utilidadNeta   = $totalIngresos - $totalGastos - $iva;

    // Totales
    $totalAC  = array_sum(array_column($activosCorrientes, 'saldo'));
    $totalAnc = array_sum(array_column($activosNoCorrientes, 'saldo'));
    $totalDep = array_sum(array_column($depAcum, 'saldo'));
    $totalAncNeto = $totalAnc + $totalDep; // dep es negativa
    $totalActivo  = $totalAC + $totalAncNeto;

    $totalPC  = array_sum(array_column($pasivosCorrientes, 'saldo'));
    $totalCap = array_sum(array_column($capitalCuentas, 'saldo'));
    $totalPatrimonio = $totalCap + $utilidadNeta;
    $totalPasivoPat  = $totalPC + $totalPatrimonio;

    echo json_encode([
        'activos_corrientes'     => $activosCorrientes,
        'total_ac'               => $totalAC,
        'activos_no_corrientes'  => $activosNoCorrientes,
        'dep_acumuladas'         => $depAcum,
        'total_anc'              => $totalAncNeto,
        'total_activo'           => $totalActivo,
        'pasivos_corrientes'     => $pasivosCorrientes,
        'total_pc'               => $totalPC,
        'capital_cuentas'        => $capitalCuentas,
        'total_capital'          => $totalCap,
        'utilidad_neta'          => $utilidadNeta,
        'total_patrimonio'       => $totalPatrimonio,
        'total_pasivo_patrimonio'=> $totalPasivoPat,
        'cuadra'                 => abs($totalActivo - $totalPasivoPat) < 1,
    ]);
    $db->close();
    exit;
}

echo json_encode(['error' => true, 'mensaje' => 'Tipo no válido']);
$db->close();
