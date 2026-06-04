<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/config.php';

$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($db->connect_error) {
    die("Error de conexion: " . $db->connect_error);
}
$db->set_charset('utf8mb4');

$queries = [
"SET FOREIGN_KEY_CHECKS = 0",
"CREATE TABLE IF NOT EXISTS empresa (id_empresa INT AUTO_INCREMENT PRIMARY KEY, nombre_empresa VARCHAR(150) NOT NULL, nit VARCHAR(20), direccion VARCHAR(200), telefono VARCHAR(20), regimen_iva VARCHAR(80), regimen_isr VARCHAR(80), descripcion TEXT) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS usuarios (id_usuario INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, usuario VARCHAR(50) NOT NULL UNIQUE, contrasena VARCHAR(100) NOT NULL, rol VARCHAR(50)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS empleados (id_empleado INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL, dpi VARCHAR(20), puesto VARCHAR(80), salario DECIMAL(10,2) DEFAULT 0, igss DECIMAL(10,2) DEFAULT 0, bonificacion DECIMAL(10,2) DEFAULT 0, fecha_ingreso DATE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS proveedores (id_proveedor INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(150) NOT NULL, telefono VARCHAR(20), direccion VARCHAR(200), nit VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS clientes (id_cliente INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(150) NOT NULL, telefono VARCHAR(20), direccion VARCHAR(200), nit VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS productos (id_producto INT AUTO_INCREMENT PRIMARY KEY, nombre_producto VARCHAR(150) NOT NULL, descripcion VARCHAR(100), precio_compra DECIMAL(10,2) DEFAULT 0, precio_venta DECIMAL(10,2) DEFAULT 0, costo DECIMAL(10,2) DEFAULT 0, stock INT DEFAULT 0, aplica_iva TINYINT(1) DEFAULT 1) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS cuentas_contables (id_cuenta INT AUTO_INCREMENT PRIMARY KEY, codigo VARCHAR(10) NOT NULL, nombre_cuenta VARCHAR(100) NOT NULL, tipo VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS libro_diario (id INT AUTO_INCREMENT PRIMARY KEY, id_partida INT NOT NULL, fecha DATE NOT NULL, descripcion VARCHAR(200), id_cuenta INT, debe DECIMAL(12,2) DEFAULT 0, haber DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS libro_mayor (id INT AUTO_INCREMENT PRIMARY KEY, id_cuenta INT, fecha DATE, debe DECIMAL(12,2) DEFAULT 0, haber DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS ajustes (id_ajuste INT AUTO_INCREMENT PRIMARY KEY, fecha DATE, descripcion VARCHAR(200), debe DECIMAL(12,2) DEFAULT 0, haber DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS depreciaciones (id_depreciacion INT AUTO_INCREMENT PRIMARY KEY, tipo_activo VARCHAR(100), valor DECIMAL(12,2) DEFAULT 0, porcentaje DECIMAL(5,2) DEFAULT 0, depreciacion_anual DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS ventas (id_venta INT AUTO_INCREMENT PRIMARY KEY, fecha DATE, no_factura VARCHAR(20), id_cliente INT, total DECIMAL(12,2) DEFAULT 0, iva DECIMAL(12,2) DEFAULT 0, tipo_pago VARCHAR(20), estado VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS detalle_ventas (id_detalle INT AUTO_INCREMENT PRIMARY KEY, id_venta INT, id_producto INT, cantidad INT DEFAULT 0, precio DECIMAL(10,2) DEFAULT 0, subtotal DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS compras (id_compra INT AUTO_INCREMENT PRIMARY KEY, fecha DATE, no_factura VARCHAR(20), id_proveedor INT, total DECIMAL(12,2) DEFAULT 0, iva DECIMAL(12,2) DEFAULT 0, tipo_pago VARCHAR(20)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS detalle_compras (id_detalle INT AUTO_INCREMENT PRIMARY KEY, id_compra INT, id_producto INT, cantidad INT DEFAULT 0, precio DECIMAL(10,2) DEFAULT 0, subtotal DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"CREATE TABLE IF NOT EXISTS pagos_credito (id_pago INT AUTO_INCREMENT PRIMARY KEY, id_venta INT, fecha DATE, monto DECIMAL(12,2) DEFAULT 0) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
"INSERT IGNORE INTO usuarios (nombre, usuario, contrasena, rol) VALUES ('Angelo Ramirez', 'admin', 'admin123', 'Gerente General')",
"SET FOREIGN_KEY_CHECKS = 1"
];

$errores = [];
foreach ($queries as $q) {
    if (!$db->query($q)) {
        $errores[] = $db->error;
    }
}

if (empty($errores)) {
    echo "Base de datos inicializada correctamente. Ya puedes iniciar sesion con admin/admin123";
} else {
    echo "Completado con algunos avisos: " . implode(", ", $errores);
}

$db->close();
