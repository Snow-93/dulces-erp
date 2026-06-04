# ERP Backend — Dulces y Delicias del Valle, S.A.

## Estructura de archivos

```
htdocs/
└── erp-backend/
    ├── config.php              ← Conexión a MySQL
    ├── api.js                  ← JS de conexión (cópialo junto a tu index.html)
    └── api/
        ├── dashboard.php       ← GET resumen ejecutivo
        ├── libro_diario.php    ← GET / POST / DELETE partidas
        ├── libro_mayor.php     ← GET cuentas en T
        ├── balance_saldos.php  ← GET balance saldos y ajustado
        ├── empleados.php       ← GET / POST / PUT / DELETE nómina
        ├── productos.php       ← GET / POST / PUT / DELETE catálogo
        ├── ajustes.php         ← GET / POST ajustes contables
        └── cuentas.php         ← GET lista de cuentas para selects
```

---

## Instalación paso a paso

### 1. Copiar archivos a XAMPP

Copia toda la carpeta `erp-backend/` dentro de:

```
C:\xampp\htdocs\
```

Resultado esperado:
```
C:\xampp\htdocs\erp-backend\config.php
C:\xampp\htdocs\erp-backend\api\dashboard.php
...
```

Tu HTML puede estar en:
```
C:\xampp\htdocs\erp\index.html   ← o donde lo tengas
```

---

### 2. Crear la base de datos en phpMyAdmin

1. Abre **http://localhost/phpmyadmin**
2. Crea una base de datos llamada `sweet_spot` (cotejamiento `utf8mb4_general_ci`)
3. Ve a la pestaña **SQL** y pega el contenido de `sweet_spot.sql` (tu script MySQL)
4. Ejecuta

---

### 3. Agregar api.js a tu HTML

En tu `index.html`, **antes** de la línea `<script src="scrip.js">`, agrega:

```html
<script src="../erp-backend/api.js"></script>
<script src="scrip.js"></script>
```

> Ajusta la ruta `../erp-backend/api.js` según dónde esté tu HTML relativo a htdocs.

---

### 4. Verificar la constante API_BASE en api.js

Abre `api.js` y confirma que esta línea apunte correctamente:

```javascript
const API_BASE = 'http://localhost/erp-backend/api';
```

Si tu HTML está dentro de una subcarpeta diferente, esta URL no cambia porque usa ruta absoluta.

---

### 5. Ajustar showPage() en scrip.js

Al final de tu `scrip.js`, asegúrate de que `showPage` llama al hook de api.js.
La forma más sencilla: al **final** de tu función `showPage` en `scrip.js`, agrega:

```javascript
function showPage(pageId, btn) {
    // ... tu código existente ...

    // ← AGREGA ESTO AL FINAL:
    if (typeof _paginasCarga !== 'undefined' && _paginasCarga[pageId]) {
        _paginasCarga[pageId]();
    }
}
```

---

### 6. Probar

1. Inicia XAMPP (Apache + MySQL)
2. Abre **http://localhost/erp/index.html** (o donde esté tu HTML)
3. Abre la consola del navegador (F12) para ver errores

Prueba rápida de la API directamente en el navegador:
```
http://localhost/erp-backend/api/dashboard.php
http://localhost/erp-backend/api/cuentas.php
http://localhost/erp-backend/api/empleados.php
```

---

## Endpoints disponibles

| Endpoint | Métodos | Descripción |
|---|---|---|
| `api/dashboard.php` | GET | KPIs y últimas partidas |
| `api/cuentas.php` | GET | Lista de cuentas contables |
| `api/libro_diario.php` | GET, POST, DELETE | Partidas contables |
| `api/libro_mayor.php` | GET | Cuentas en T con movimientos |
| `api/balance_saldos.php?tipo=saldos` | GET | Balance de saldos |
| `api/balance_saldos.php?tipo=ajustado` | GET | Balance ajustado |
| `api/empleados.php` | GET, POST, PUT, DELETE | Nómina de empleados |
| `api/productos.php` | GET, POST, PUT, DELETE | Catálogo de productos |
| `api/ajustes.php` | GET, POST | Ajustes contables |

---

## Solución de errores comunes

**"No se pudo cargar — ¿Está corriendo XAMPP?"**
→ Verifica que Apache y MySQL estén activos en el panel de XAMPP.

**Error CORS**
→ Ya están configurados los headers en `config.php`. Si persiste, abre el HTML desde `http://localhost/...` en lugar de `file://`.

**"Error de conexión: Access denied"**
→ En `config.php`, verifica `DB_USER` y `DB_PASS`. En XAMPP por defecto son `root` y `''` (vacío).
