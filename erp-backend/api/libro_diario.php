<?php
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $mes  = isset($_GET['mes'])  ? (int)$_GET['mes']  : 0;
    $anio = isset($_GET['anio']) ? (int)$_GET['anio'] : 0;

    $where = '';
    if ($mes && $anio) {
        $where = "WHERE MONTH(ld.fecha) = $mes AND YEAR(ld.fecha) = $anio";
    }

    $partidas = [];
    $res = $db->query("
        SELECT ld.id_partida,
               DATE_FORMAT(MIN(ld.fecha),'%d/%m/%Y') AS fecha,
               ld.descripcion,
               cc.codigo, cc.nombre_cuenta, cc.tipo,
               ld.debe, ld.haber
        FROM libro_diario ld
        JOIN cuentas_contables cc ON ld.id_cuenta = cc.id_cuenta
        $where
        GROUP BY ld.id_partida, ld.descripcion, cc.codigo, cc.nombre_cuenta, cc.tipo, ld.debe, ld.haber
        ORDER BY ld.id_partida ASC, ld.debe DESC
    ");

    if (!$res) { echo json_encode(['error'=>true,'mensaje'=>$db->error]); exit; }

    while ($row = $res->fetch_assoc()) {
        $id = $row['id_partida'];
        if (!isset($partidas[$id])) {
            $partidas[$id] = [
                'id_partida'  => (int)$id,
                'fecha'       => $row['fecha'],
                'descripcion' => $row['descripcion'],
                'lineas'      => [],
                'total_debe'  => 0,
                'total_haber' => 0,
            ];
        }
        $partidas[$id]['lineas'][] = [
            'codigo'        => $row['codigo'],
            'nombre_cuenta' => $row['nombre_cuenta'],
            'tipo'          => $row['tipo'],
            'debe'          => (float)$row['debe'],
            'haber'         => (float)$row['haber'],
        ];
        $partidas[$id]['total_debe']  += (float)$row['debe'];
        $partidas[$id]['total_haber'] += (float)$row['haber'];
    }

    echo json_encode(array_values($partidas));
    $db->close();
    exit;
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (empty($body['lineas']) || empty($body['fecha'])) {
        http_response_code(400);
        echo json_encode(['error'=>true,'mensaje'=>'Datos incompletos']);
        exit;
    }

    $sumaDebe = $sumaHaber = 0;
    foreach ($body['lineas'] as $l) {
        $sumaDebe  += (float)$l['debe'];
        $sumaHaber += (float)$l['haber'];
    }

    if (abs($sumaDebe - $sumaHaber) > 0.01) {
        http_response_code(422);
        echo json_encode(['error'=>true,'mensaje'=>"No cuadra. Debe: Q$sumaDebe — Haber: Q$sumaHaber"]);
        exit;
    }

    $maxRes = $db->query("SELECT COALESCE(MAX(id_partida),0)+1 AS next_id FROM libro_diario");
    $nextId = $maxRes ? (int)$maxRes->fetch_assoc()['next_id'] : 1;

    $fecha       = $db->real_escape_string($body['fecha']);
    $descripcion = $db->real_escape_string($body['descripcion']);

    foreach ($body['lineas'] as $linea) {
        $id_cuenta = (int)$linea['id_cuenta'];
        $debe      = number_format((float)$linea['debe'],  2, '.', '');
        $haber     = number_format((float)$linea['haber'], 2, '.', '');

        $sql = "INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber)
                VALUES ($nextId,'$fecha','$descripcion',$id_cuenta,$debe,$haber)";

        if (!$db->query($sql)) {
            echo json_encode(['error'=>true,'mensaje'=>'Error INSERT: '.$db->error]);
            exit;
        }
    }

    echo json_encode(['ok'=>true,'id_partida'=>$nextId]);
    $db->close();
    exit;
}

if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error'=>true,'mensaje'=>'ID requerido']); exit; }
    $db->query("DELETE FROM libro_diario WHERE id_partida = $id");
    echo json_encode(['ok'=>true]);
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error'=>true,'mensaje'=>'Método no permitido']);
