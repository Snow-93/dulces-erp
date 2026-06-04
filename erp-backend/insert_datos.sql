-- ============================================================
--  DULCES Y DELICIAS DEL VALLE, S.A.
--  Solo INSERT — ejecutar en phpMyAdmin sobre sweet_spot
-- ============================================================

USE sweet_spot;

-- EMPRESA
INSERT INTO empresa (nombre_empresa, nit, direccion, telefono, regimen_iva, regimen_isr, descripcion)
VALUES ('Dulces y Delicias del Valle, S.A.','98765432-1','12 Av. 5-67, Zona 11, Guatemala','2222-3333','Pequeño Contribuyente 5%','Opcional Simplificado','Empresa dedicada a la distribución de bebidas, golosinas y snacks');

-- USUARIOS
INSERT INTO usuarios (nombre, usuario, contraseña, rol) VALUES
('Angelo Ramírez','admin','admin123','Gerente General');

-- EMPLEADOS
INSERT INTO empleados (nombre, dpi, puesto, salario, igss, bonificacion, fecha_ingreso) VALUES
('Angelo Ramírez',         '2901234560101','Gerente General',    8000.00,386.40,250.00,'2026-01-10'),
('Luis Fernando Pac Ajú',  '1234567890101','Contador',           5500.00,265.65,250.00,'2026-01-10'),
('María José Ramos Cú',    '9876543210101','Vendedor / Asesor',  3500.00,169.05,250.00,'2026-01-10'),
('Carlos Enrique Ajú Tujal','1122334450101','Bodeguero',         3200.00,154.56,250.00,'2026-01-10'),
('Pedro Anastacio Coc Xol','5566778890101','Piloto / Repartidor',3200.00,154.56,250.00,'2026-01-10');

-- PROVEEDORES
INSERT INTO proveedores (nombre, telefono, direccion, nit) VALUES
('Distribuidora Nacional S.A.','2345-6789','5a Av. 12-34, Zona 9, Guatemala','12345678-9'),
('Importadora del Valle Ltda.','3456-7890','10 Calle 5-67, Zona 4, Guatemala','98765432-1'),
('Snacks y Más S.A.','4567-8901','Calzada Roosevelt 15-30, Zona 7','11223344-5');

-- CLIENTES
INSERT INTO clientes (nombre, telefono, direccion, nit) VALUES
('Tienda La Economía',  '5555-1111','Zona 1, Guatemala','CF'),
('Supermercado Don Pepe','5555-2222','Zona 3, Guatemala','CF'),
('Minimarket El Sol',   '5555-3333','Zona 6, Guatemala','CF'),
('Distribuidora Xela',  '5555-4444','Quetzaltenango','44556677-8');

-- PRODUCTOS
INSERT INTO productos (nombre_producto, descripcion, precio_compra, precio_venta, costo, stock, aplica_iva) VALUES
('Coca-Cola 350ml',         'Bebidas', 7.50, 12.00, 7.50,120,1),
('Pepsi 350ml',             'Bebidas', 7.00, 11.00, 7.00, 80,1),
('Agua Pura 500ml',         'Bebidas', 2.50,  5.00, 2.50,200,1),
('Jugo Del Valle 250ml',    'Bebidas', 5.00,  8.50, 5.00, 90,1),
('Gatorade 500ml',          'Bebidas', 9.00, 14.00, 9.00, 60,1),
('Red Bull 250ml',          'Bebidas',16.00, 25.00,16.00, 40,1),
('Nesquik 200ml',           'Bebidas', 6.00, 10.00, 6.00, 75,1),
('Chocolate Abuelita 33g',  'Golosinas',3.50, 6.00, 3.50,150,1),
('Chiclets Adams',          'Golosinas',1.00, 2.00, 1.00,300,1),
('Paleta Payaso',           'Golosinas',1.50, 3.00, 1.50,200,1),
('Gomitas Haribo 100g',     'Golosinas',8.00,13.00, 8.00, 80,1),
('Chocolate Snickers 52g',  'Golosinas',10.00,16.00,10.00,60,1),
('Caramelos Halls',         'Golosinas',2.00, 4.00, 2.00,180,1),
('Chocolinas 150g',         'Golosinas',9.00,15.00, 9.00, 70,1),
('Tortrix 30g',             'Snacks',  2.50, 4.50, 2.50,200,1),
('Doritos 45g',             'Snacks',  6.00,10.00, 6.00,100,1),
('Ruffles 45g',             'Snacks',  6.00,10.00, 6.00, 90,1),
('Cheetos 40g',             'Snacks',  5.50, 9.00, 5.50, 85,1),
('Pringles Original 124g',  'Snacks', 22.00,35.00,22.00, 45,1),
('Maní Salado 100g',        'Snacks',  4.00, 7.00, 4.00,120,1),
('Palomitas Act II',        'Snacks',  7.00,12.00, 7.00, 65,1),
('Chicle Trident',          'Varios',  3.00, 5.00, 3.00,150,1),
('Mentos Menta',            'Varios',  4.00, 7.00, 4.00,100,1),
('Galletas Oreo 133g',      'Varios', 10.00,16.00,10.00, 80,1),
('Galletas Ritz 200g',      'Varios', 12.00,19.00,12.00, 60,1),
('Barra Granola Nature',    'Varios', 11.00,18.00,11.00, 50,1),
('Gelatina Jell-O 85g',     'Varios',  5.00, 8.50, 5.00, 70,1),
('Leche Condensada 397g',   'Varios', 16.00,25.00,16.00, 40,1),
('Chocolate Toblerone 100g','Varios', 28.00,42.00,28.00, 30,1);

-- DEPRECIACIONES
INSERT INTO depreciaciones (tipo_activo, valor, porcentaje, depreciacion_anual) VALUES
('Vehículo de Reparto',      85000.00,20.00,17000.00),
('Mobiliario y Equipo',      18000.00,20.00, 3600.00),
('Equipo de Cómputo',        12500.00,33.33, 4166.67),
('Herramientas y Eq. Bodega', 8000.00,25.00, 2000.00);

-- AJUSTES
INSERT INTO ajustes (fecha, descripcion, debe, haber) VALUES
('2026-01-31','Ajuste A — Provisión Prestaciones Laborales',4875.00,4875.00),
('2026-01-31','Ajuste B — Depreciación mensual activos fijos',2230.56,2230.56),
('2026-01-31','Ajuste C — IVA Pequeño Contribuyente 5%',2100.00,2100.00);

-- LIBRO DIARIO — P-01 Apertura
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',1,35000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',2,30000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',4,15000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',5,85000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',6,18000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',7,12500.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',8, 8000.00,0),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',13,0,116000.00),
(1,'2026-01-10','Partida de Apertura — Ecuación Patrimonial',21,0, 87500.00);

-- P-02 Compra
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(2,'2026-01-12','Compra de Mercadería a crédito',4,35000.00,0),
(2,'2026-01-12','Compra de Mercadería a crédito',13,0,35000.00);

-- P-03 Venta contado
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(3,'2026-01-15','Venta de mercadería al contado',1,25000.00,0),
(3,'2026-01-15','Venta de mercadería al contado',22,0,25000.00);

-- P-04 Venta crédito
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(4,'2026-01-18','Venta de mercadería al crédito',3,17000.00,0),
(4,'2026-01-18','Venta de mercadería al crédito',22,0,17000.00);

-- P-05 Costo ventas
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(5,'2026-01-18','Registro costo de mercadería vendida',23,28500.00,0),
(5,'2026-01-18','Registro costo de mercadería vendida',4,0,28500.00);

-- P-06 Sueldos
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',24,23400.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',25, 2964.78,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',26,  234.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',27,  234.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',28, 1950.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',29, 1950.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',30,  975.00,0),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',1,0,22270.38),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',14,0, 1130.22),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',15,0, 2964.78),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',16,0,  468.00),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',17,0, 1950.00),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',18,0, 1950.00),
(6,'2026-01-31','Planilla sueldos y prestaciones — Enero 2026',19,0,  975.00);

-- P-07 Depreciaciones
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',31,1416.67,0),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',32, 300.00,0),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',33, 347.22,0),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',34, 166.67,0),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',9,0,1416.67),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',10,0, 300.00),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',11,0, 347.22),
(7,'2026-01-31','Depreciación mensual activos fijos — Enero 2026',12,0, 166.67);

-- P-08 Cobro crédito
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(8,'2026-01-28','Cobro de venta al crédito',1,17000.00,0),
(8,'2026-01-28','Cobro de venta al crédito',3,0,17000.00);

-- P-09 IVA
INSERT INTO libro_diario (id_partida,fecha,descripcion,id_cuenta,debe,haber) VALUES
(9,'2026-01-31','Regularización IVA Pequeño Contribuyente 5%',1,0,2100.00),
(9,'2026-01-31','Regularización IVA Pequeño Contribuyente 5%',20,0,2100.00);

-- VENTAS
INSERT INTO ventas (fecha,no_factura,id_cliente,total,iva,tipo_pago,estado) VALUES
('2026-01-15','FAC-001',1,25000.00,1250.00,'Contado','Pagada'),
('2026-01-18','FAC-002',2,17000.00, 850.00,'Crédito','Cobrada');

-- COMPRAS
INSERT INTO compras (fecha,no_factura,id_proveedor,total,iva,tipo_pago) VALUES
('2026-01-12','COM-001',1,35000.00,1750.00,'Crédito');

SELECT '✅ Datos insertados correctamente' AS resultado;
