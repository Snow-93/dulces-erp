<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/config.php';

$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
if ($db->connect_error) die("Error: " . $db->connect_error);
$db->set_charset('utf8mb4');

$queries = [
"INSERT IGNORE INTO empresa (nombre_empresa, nit, direccion, telefono, regimen_iva, regimen_isr, descripcion) VALUES ('Dulces y Delicias del Valle, S.A.','98765432-1','12 Av. 5-67, Zona 11, Guatemala','2222-3333','Pequeño Contribuyente 5%','Opcional Simplificado','Empresa dedicada a la distribución de bebidas, golosinas y snacks')",

"INSERT IGNORE INTO empleados (nombre, dpi, puesto, salario, igss, bonificacion, fecha_ingreso) VALUES ('Angelo Ramirez','2901234560101','Gerente General',8000.00,386.40,250.00,'2026-01-10'),('Luis Fernando Pac Aju','1234567890101','Contador',5500.00,265.65,250.00,'2026-01-10'),('Maria Jose Ramos Cu','9876543210101','Vendedor / Asesor',3500.00,169.05,250.00,'2026-01-10'),('Carlos Enrique Aju Tujal','1122334450101','Bodeguero',3200.00,154.56,250.00,'2026-01-10'),('Pedro Anastacio Coc Xol','5566778890101','Piloto / Repartidor',3200.00,154.56,250.00,'2026-01-10')",

"INSERT IGNORE INTO proveedores (nombre, telefono, direccion, nit) VALUES ('Distribuidora Nacional S.A.','2345-6789','5a Av. 12-34, Zona 9, Guatemala','12345678-9'),('Importadora del Valle Ltda.','3456-7890','10 Calle 5-67, Zona 4, Guatemala','98765432-1'),('Snacks y Mas S.A.','4567-8901','Calzada Roosevelt 15-30, Zona 7','11223344-5')",

"INSERT IGNORE INTO clientes (nombre, telefono, direccion, nit) VALUES ('Tienda La Economia','5555-1111','Zona 1, Guatemala','CF'),('Supermercado Don Pepe','5555-2222','Zona 3, Guatemala','CF'),('Minimarket El Sol','5555-3333','Zona 6, Guatemala','CF'),('Distribuidora Xela','5555-4444','Quetzaltenango','44556677-8')",

"INSERT IGNORE INTO productos (nombre_producto, descripcion, precio_compra, precio_venta, costo, stock, aplica_iva) VALUES ('Coca-Cola 350ml','Bebidas',7.50,12.00,7.50,120,1),('Pepsi 350ml','Bebidas',7.00,11.00,7.00,80,1),('Agua Pura 500ml','Bebidas',2.50,5.00,2.50,200,1),('Jugo Del Valle 250ml','Bebidas',5.00,8.50,5.00,90,1),('Gatorade 500ml','Bebidas',9.00,14.00,9.00,60,1),('Red Bull 250ml','Bebidas',16.00,25.00,16.00,40,1),('Nesquik 200ml','Bebidas',6.00,10.00,6.00,75,1),('Chocolate Abuelita 33g','Golosinas',3.50,6.00,3.50,150,1),('Chiclets Adams','Golosinas',1.00,2.00,1.00,300,1),('Paleta Payaso','Golosinas',1.50,3.00,1.50,200,1),('Gomitas Haribo 100g','Golosinas',8.00,13.00,8.00,80,1),('Chocolate Snickers 52g','Golosinas',10.00,16.00,10.00,60,1),('Caramelos Halls','Golosinas',2.00,4.00,2.00,180,1),('Chocolinas 150g','Golosinas',9.00,15.00,9.00,70,1),('Tortrix 30g','Snacks',2.50,4.50,2.50,200,1),('Doritos 45g','Snacks',6.00,10.00,6.00,100,1),('Ruffles 45g','Snacks',6.00,10.00,6.00,90,1),('Cheetos 40g','Snacks',5.50,9.00,5.50,85,1),('Pringles Original 124g','Snacks',22.00,35.00,22.00,45,1),('Mani Salado 100g','Snacks',4.00,7.00,4.00,120,1),('Palomitas Act II','Snacks',7.00,12.00,7.00,65,1),('Chicle Trident','Varios',3.00,5.00,3.00,150,1),('Mentos Menta','Varios',4.00,7.00,4.00,100,1),('Galletas Oreo 133g','Varios',10.00,16.00,10.00,80,1),('Galletas Ritz 200g','Varios',12.00,19.00,12.00,60,1),('Barra Granola Nature','Varios',11.00,18.00,11.00,50,1),('Gelatina Jell-O 85g','Varios',5.00,8.50,5.00,70,1),('Leche Condensada 397g','Varios',16.00,25.00,16.00,40,1),('Chocolate Toblerone 100g','Varios',28.00,42.00,28.00,30,1)",

"INSERT IGNORE INTO cuentas_contables (codigo, nombre_cuenta, tipo) VALUES ('1101','Caja','ACTIVO'),('1102','Bancos','ACTIVO'),('1103','Cuentas por Cobrar','ACTIVO'),('1201','Mercancias','ACTIVO'),('1501','Vehiculo de Reparto','ACTIVO'),('1502','Mobiliario y Equipo','ACTIVO'),('1503','Equipo de Computo','ACTIVO'),('1504','Herramientas y Eq. Bodega','ACTIVO'),('1511','Dep. Acum. Vehiculo','ACTIVO'),('1512','Dep. Acum. Mobiliario','ACTIVO'),('1513','Dep. Acum. Eq. Computo','ACTIVO'),('1514','Dep. Acum. Herramientas','ACTIVO'),('2101','Cuentas por Pagar','PASIVO'),('2102','IGSS Lab. por Pagar','PASIVO'),('2103','IGSS Pat. por Pagar','PASIVO'),('2104','IRTRA/INTECAP por Pagar','PASIVO'),('2105','Reserva Bono 14','PASIVO'),('2106','Reserva Aguinaldo','PASIVO'),('2107','Reserva Vacaciones','PASIVO'),('2108','IVA por Pagar','PASIVO'),('3101','Capital Angelo Ramirez','CAPITAL'),('4101','Ventas','INGRESO'),('5101','Costo de Ventas','GASTO'),('6101','Gasto Sueldos','GASTO'),('6102','Gasto IGSS Patronal','GASTO'),('6103','Gasto IRTRA','GASTO'),('6104','Gasto INTECAP','GASTO'),('6105','Provision Bono 14','GASTO'),('6106','Provision Aguinaldo','GASTO'),('6107','Provision Vacaciones','GASTO'),('6201','Dep. Vehiculo','GASTO'),('6202','Dep. Mobiliario','GASTO'),('6203','Dep. Eq. Computo','GASTO'),('6204','Dep. Herramientas','GASTO')",

"INSERT IGNORE INTO depreciaciones (tipo_activo, valor, porcentaje, depreciacion_anual) VALUES ('Vehiculo de Reparto',85000.00,20.00,17000.00),('Mobiliario y Equipo',18000.00,20.00,3600.00),('Equipo de Computo',12500.00,33.33,4166.67),('Herramientas y Eq. Bodega',8000.00,25.00,2000.00)",

"INSERT IGNORE INTO ajustes (fecha, descripcion, debe, haber) VALUES ('2026-01-31','Ajuste A - Provision Prestaciones Laborales',4875.00,4875.00),('2026-01-31','Ajuste B - Depreciacion mensual activos fijos',2230.56,2230.56),('2026-01-31','Ajuste C - IVA Pequeño Contribuyente 5%',2100.00,2100.00)",

"INSERT IGNORE INTO ventas (fecha, no_factura, id_cliente, total, iva, tipo_pago, estado) VALUES ('2026-01-15','FAC-001',1,25000.00,1250.00,'Contado','Pagada'),('2026-01-18','FAC-002',2,17000.00,850.00,'Credito','Cobrada')",

"INSERT IGNORE INTO compras (fecha, no_factura, id_proveedor, total, iva, tipo_pago) VALUES ('2026-01-12','COM-001',1,35000.00,1750.00,'Credito')"
];

$ok = 0;
$errores = [];
foreach ($queries as $q) {
    if ($db->query($q)) {
        $ok++;
    } else {
        $errores[] = $db->error;
    }
}

echo "Completado: $ok queries exitosas. ";
if ($errores) echo "Errores: " . implode(", ", $errores);
else echo "Todos los datos insertados correctamente.";

$db->close();
