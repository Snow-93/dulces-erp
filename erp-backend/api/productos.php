<?php
// ============================================================
//  api/productos.php — CRUD de catálogo de productos
// ============================================================
require_once '../config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    $productos = [];
    $res = $db->query("SELECT * FROM productos ORDER BY id_producto ASC");
    while ($row = $res->fetch_assoc()) {
        $compra  = (float)$row['precio_compra'];
        $venta   = (float)$row['precio_venta'];
        $margen  = $venta > 0 ? round((($venta - $compra) / $venta) * 100, 1) : 0;
        $row['margen_pct'] = $margen;
        $productos[] = $row;
    }
    echo json_encode($productos);
    $db->close();
    exit;
}

// ── POST ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $b = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("
        INSERT INTO productos (nombre_producto, descripcion, precio_compra, precio_venta, costo, stock, aplica_iva)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $aplica = isset($b['aplica_iva']) ? (int)$b['aplica_iva'] : 1;
    $stmt->bind_param('ssdddi i',
        $b['nombre_producto'], $b['descripcion'],
        $b['precio_compra'],   $b['precio_venta'],
        $b['costo'],           $b['stock'], $aplica
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
        UPDATE productos
        SET nombre_producto=?, descripcion=?, precio_compra=?, precio_venta=?, costo=?, stock=?, aplica_iva=?
        WHERE id_producto=?
    ");
    $aplica = isset($b['aplica_iva']) ? (int)$b['aplica_iva'] : 1;
    $stmt->bind_param('ssdddiii',
        $b['nombre_producto'], $b['descripcion'],
        $b['precio_compra'],   $b['precio_venta'],
        $b['costo'],           $b['stock'], $aplica, $id
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
    $stmt = $db->prepare("DELETE FROM productos WHERE id_producto = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    echo json_encode(['ok' => true]);
    $stmt->close();
    $db->close();
    exit;
}

http_response_code(405);
echo json_encode(['error' => true, 'mensaje' => 'Método no permitido']);
