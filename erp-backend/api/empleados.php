<?php
// ============================================================
//  api/empleados.php — CRUD de empleados + cálculo nómina
//  GET    → lista todos con cálculos de nómina
//  POST   → crea empleado
//  PUT    → actualiza (id en query ?id=N)
//  DELETE → elimina  (id en query ?id=N)
// ============================================================
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// Constantes legales Guatemala
const IGSS_LABORAL  = 0.0483;  // 4.83%
const IGSS_PATRONAL = 0.1267;  // 12.67%
const IRTRA         = 0.01;    // 1%
const INTECAP       = 0.01;    // 1%

function calcularNomina(array $emp): array {
    $salario      = (float)$emp['salario'];
    $igss_lab     = round($salario * IGSS_LABORAL, 2);
    $igss_pat     = round($salario * IGSS_PATRONAL, 2);
    $irtra        = round($salario * IRTRA, 2);
    $intecap      = round($salario * INTECAP, 2);
    $bono14_mes   = round($salario / 12, 2);
    $aguinaldo_mes= round($salario / 12, 2);
    $vacaciones   = round(($salario / 365) * 15 / 12, 2);
    $neto         = round($salario - $igss_lab, 2);
    $costo_total  = round($salario + $igss_pat + $irtra + $intecap + $bono14_mes + $aguinaldo_mes + $vacaciones, 2);

    return array_merge($emp, [
        'igss_laboral'  => $igss_lab,
        'igss_patronal' => $igss_pat,
        'irtra'         => $irtra,
        'intecap'       => $intecap,
        'bono14_mes'    => $bono14_mes,
        'aguinaldo_mes' => $aguinaldo_mes,
        'vacaciones_mes'=> $vacaciones,
        'salario_neto'  => $neto,
        'costo_total'   => $costo_total,
    ]);
}

// ── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    $empleados = [];
    $res = $db->query("SELECT * FROM empleados ORDER BY id_empleado ASC");
    while ($row = $res->fetch_assoc()) {
        $empleados[] = calcularNomina($row);
    }

    // Totales de planilla
    $totales = array_reduce($empleados, function ($carry, $e) {
        $carry['salario_bruto']  += $e['salario'];
        $carry['igss_laboral']   += $e['igss_laboral'];
        $carry['igss_patronal']  += $e['igss_patronal'];
        $carry['salario_neto']   += $e['salario_neto'];
        $carry['costo_total']    += $e['costo_total'];
        return $carry;
    }, ['salario_bruto'=>0,'igss_laboral'=>0,'igss_patronal'=>0,'salario_neto'=>0,'costo_total'=>0]);

    echo json_encode(['empleados' => $empleados, 'totales' => $totales]);
    $db->close();
    exit;
}

// ── POST ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("
        INSERT INTO empleados (nombre, dpi, puesto, salario, igss, bonificacion, fecha_ingreso)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sssddds',
        $b['nombre'], $b['dpi'], $b['puesto'],
        $b['salario'], $b['igss'], $b['bonificacion'], $b['fecha_ingreso']
    );
    $stmt->execute();
    echo json_encode(['ok' => true, 'id' => $db->insert_id]);
    $stmt->close();
    $db->close();
    exit;
}

// ── PUT ──────────────────────────────────────────────────────
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    $b  = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("
        UPDATE empleados SET nombre=?, dpi=?, puesto=?, salario=?, igss=?, bonificacion=?, fecha_ingreso=?
        WHERE id_empleado=?
    ");
    $stmt->bind_param('sssdddsi',
        $b['nombre'], $b['dpi'], $b['puesto'],
        $b['salario'], $b['igss'], $b['bonificacion'], $b['fecha_ingreso'], $id
    );
    $stmt->execute();
    echo json_encode(['ok' => true]);
    $stmt->close();
    $db->close();
    exit;
}

// ── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $db->prepare("DELETE FROM empleados WHERE id_empleado = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['ok' => true]);
    $stmt->close();
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
