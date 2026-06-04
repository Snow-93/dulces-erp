// ============================================================
//  api.js — Capa de comunicación Frontend ↔ Backend PHP
//  Dulces y Delicias del Valle, S.A. · ERP 2026
//
//  Coloca este archivo junto a tu index.html y cárgalo ANTES
//  que scrip.js:
//    <script src="api.js"></script>
//    <script src="scrip.js"></script>
// ============================================================

// ── Configuración ───────────────────────────────────────────
// Cambia esta ruta si tu proyecto está en una subcarpeta de htdocs
const API_BASE = 'https://dulces-erp-production.up.railway.app/erp-backend/api';

// ── Helper: fetch con manejo de errores ─────────────────────
async function apiGet(endpoint) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error(`[API GET] ${endpoint}:`, err);
        mostrarError(`No se pudo cargar "${endpoint}". ¿Está corriendo XAMPP?`);
        return null;
    }
}

async function apiPost(endpoint, data) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (err) {
        console.error(`[API POST] ${endpoint}:`, err);
        mostrarError('Error al guardar los datos.');
        return null;
    }
}

async function apiPut(endpoint, id, data) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (err) {
        console.error(`[API PUT] ${endpoint}:`, err);
        mostrarError('Error al actualizar.');
        return null;
    }
}

async function apiDelete(endpoint, id) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}?id=${id}`, {
            method: 'DELETE',
        });
        return await res.json();
    } catch (err) {
        console.error(`[API DELETE] ${endpoint}:`, err);
        mostrarError('Error al eliminar.');
        return null;
    }
}

function mostrarError(msg) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'Error de conexión', text: msg, timer: 4000 });
    } else {
        alert(msg);
    }
}

function fmt(n) {
    return 'Q ' + parseFloat(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ════════════════════════════════════════════════════════════
//  DASHBOARD
// ════════════════════════════════════════════════════════════
async function cargarDashboard() {
    const data = await apiGet('dashboard.php');
    if (!data) return;

    // Actualizar stat cards dinámicamente si existen esos elementos
    actualizarStatCard('stat-capital',   fmt(data.capital));
    actualizarStatCard('stat-ventas',    fmt(data.ventas));
    actualizarStatCard('stat-costo',     fmt(data.costo_ventas));
    actualizarStatCard('stat-utilidad',  fmt(data.utilidad_bruta));
    actualizarStatCard('stat-gastos',    fmt(data.gastos_totales));
    actualizarStatCard('stat-empleados', data.empleados);

    // Tabla de partidas en el dashboard
    const tbody = document.querySelector('#page-dashboard tbody');
    if (tbody && data.partidas.length) {
        tbody.innerHTML = data.partidas.map((p, i) => `
            <tr>
              <td><span class="tag tag-primary">P-0${i + 1}</span></td>
              <td>${escHtml(p.descripcion)}</td>
              <td class="text-end amount-debe">${fmt(p.total_debe)}</td>
              <td class="text-end amount-haber">${fmt(p.total_haber)}</td>
            </tr>`).join('');
    }
}

function actualizarStatCard(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

// ════════════════════════════════════════════════════════════
//  LIBRO DIARIO
// ════════════════════════════════════════════════════════════
async function cargarLibroDiario() {
    const partidas = await apiGet('libro_diario.php');
    if (!partidas) return;

    const container = document.getElementById('partidas-container');
    if (!container) return;

    container.innerHTML = partidas.map(p => `
        <div class="section-card mb-3">
          <div class="section-card-header">
            <div class="section-card-title">
              <i class="bi bi-journal-text"></i>
              <span class="tag tag-primary me-2">P-${String(p.id_partida).padStart(2,'0')}</span>
              ${escHtml(p.descripcion)}
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="text-muted" style="font-size:12px">${p.fecha}</span>
              <button class="btn btn-sm btn-outline-danger"
                onclick="eliminarPartida(${p.id_partida})" title="Eliminar partida">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="section-card-body p-0">
            <table class="table table-hover mb-0" style="font-size:13px">
              <thead>
                <tr>
                  <th>Código</th><th>Cuenta</th><th>Naturaleza</th>
                  <th class="text-end">Debe</th><th class="text-end">Haber</th>
                </tr>
              </thead>
              <tbody>
                ${p.lineas.map(l => `
                  <tr>
                    <td class="amount">${l.codigo}</td>
                    <td>${escHtml(l.nombre_cuenta)}</td>
                    <td><span class="tag tag-${tipoTag(l.tipo)}">${l.tipo}</span></td>
                    <td class="text-end amount-debe">${l.debe > 0 ? fmt(l.debe) : '—'}</td>
                    <td class="text-end amount-haber">${l.haber > 0 ? fmt(l.haber) : '—'}</td>
                  </tr>`).join('')}
                <tr class="table-light fw-bold">
                  <td colspan="3" class="text-end">TOTALES</td>
                  <td class="text-end amount-debe">${fmt(p.total_debe)}</td>
                  <td class="text-end amount-haber">${fmt(p.total_haber)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`).join('');

    // Botón para agregar nueva partida
    container.insertAdjacentHTML('beforeend', `
        <button class="btn btn-primary mt-2" onclick="abrirModalPartida()">
          <i class="bi bi-plus-circle"></i> Nueva Partida
        </button>`);
}

async function eliminarPartida(id) {
    const confirm = await Swal.fire({
        title: '¿Eliminar partida?', text: `Partida #${id}`,
        icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c0392b',
    });
    if (!confirm.isConfirmed) return;

    const res = await apiDelete('libro_diario.php', id);
    if (res?.ok) {
        Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
        cargarLibroDiario();
    }
}

// Modal de nueva partida
async function abrirModalPartida() {
    const cuentas = await apiGet('cuentas.php');
    if (!cuentas) return;

    const opciones = cuentas.map(c =>
        `<option value="${c.id_cuenta}">${c.codigo} — ${c.nombre_cuenta}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
        title: 'Nueva Partida Contable',
        width: 700,
        html: `
          <div style="text-align:left">
            <div class="mb-2">
              <label class="form-label fw-bold">Fecha</label>
              <input id="swal-fecha" type="date" class="form-control"
                value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="mb-2">
              <label class="form-label fw-bold">Descripción / Concepto</label>
              <input id="swal-desc" type="text" class="form-control" placeholder="Ej: Venta al contado...">
            </div>
            <div id="swal-lineas">
              ${filaPartida(opciones)}
              ${filaPartida(opciones)}
            </div>
            <button class="btn btn-sm btn-outline-primary mt-2"
              onclick="document.getElementById('swal-lineas').insertAdjacentHTML('beforeend',
              \`${filaPartida(opciones).replace(/`/g,'\\`')}\`)">
              <i class="bi bi-plus"></i> Agregar línea
            </button>
          </div>`,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar',
        showCancelButton: true,
        preConfirm: () => {
            const fecha = document.getElementById('swal-fecha').value;
            const desc  = document.getElementById('swal-desc').value.trim();
            const filas = document.querySelectorAll('.fila-partida');
            const lineas = [];
            filas.forEach(f => {
                const cuenta = f.querySelector('.sel-cuenta').value;
                const debe   = parseFloat(f.querySelector('.inp-debe').value)  || 0;
                const haber  = parseFloat(f.querySelector('.inp-haber').value) || 0;
                if (cuenta && (debe > 0 || haber > 0)) {
                    lineas.push({ id_cuenta: parseInt(cuenta), debe, haber });
                }
            });
            if (!fecha || !desc || lineas.length < 2) {
                Swal.showValidationMessage('Completa fecha, descripción y al menos 2 líneas');
                return false;
            }
            return { fecha, descripcion: desc, lineas };
        }
    });

    if (formValues) {
        const res = await apiPost('libro_diario.php', formValues);
        if (res?.ok) {
            Swal.fire({ icon: 'success', title: `Partida P-${res.id_partida} guardada`, timer: 1800, showConfirmButton: false });
            cargarLibroDiario();
        } else if (res?.mensaje) {
            Swal.fire({ icon: 'error', title: 'Error', text: res.mensaje });
        }
    }
}

function filaPartida(opciones) {
    return `<div class="fila-partida d-flex gap-2 mb-1 align-items-center">
        <select class="form-select form-select-sm sel-cuenta" style="flex:3">${opciones}</select>
        <input type="number" class="form-control form-control-sm inp-debe" placeholder="Debe" step="0.01" style="flex:1.2">
        <input type="number" class="form-control form-control-sm inp-haber" placeholder="Haber" step="0.01" style="flex:1.2">
    </div>`;
}

// ════════════════════════════════════════════════════════════
//  LIBRO MAYOR
// ════════════════════════════════════════════════════════════
async function cargarLibroMayor() {
    const cuentas = await apiGet('libro_mayor.php');
    if (!cuentas) return;

    const grid = document.getElementById('mayorGrid');
    if (!grid) return;

    grid.innerHTML = cuentas.map(c => `
        <div class="mayor-card section-card">
          <div class="section-card-header">
            <div class="section-card-title">
              <span class="amount me-1">${c.codigo}</span> ${escHtml(c.nombre_cuenta)}
            </div>
            <span class="tag tag-${tipoTag(c.tipo)}">${c.tipo}</span>
          </div>
          <div class="section-card-body p-0">
            <table class="table table-sm mb-0" style="font-size:12px">
              <thead><tr><th>Fecha</th><th>Concepto</th><th class="text-end">Debe</th><th class="text-end">Haber</th></tr></thead>
              <tbody>
                ${c.movimientos.map(m => `
                  <tr>
                    <td>${m.fecha}</td>
                    <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                        title="${escHtml(m.descripcion)}">${escHtml(m.descripcion)}</td>
                    <td class="text-end amount-debe">${m.debe > 0 ? fmt(m.debe) : ''}</td>
                    <td class="text-end amount-haber">${m.haber > 0 ? fmt(m.haber) : ''}</td>
                  </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr class="fw-bold table-light">
                  <td colspan="2">SALDOS</td>
                  <td class="text-end amount-debe">${fmt(c.total_debe)}</td>
                  <td class="text-end amount-haber">${fmt(c.total_haber)}</td>
                </tr>
                <tr>
                  <td colspan="2" class="fw-bold">
                    Saldo ${c.naturaleza}
                  </td>
                  <td colspan="2" class="text-end fw-bold ${c.naturaleza === 'DEUDOR' ? 'amount-debe' : 'amount-haber'}">
                    ${fmt(c.saldo)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>`).join('');
}

// ════════════════════════════════════════════════════════════
//  BALANCE DE SALDOS
// ════════════════════════════════════════════════════════════
async function cargarBalanceSaldos() {
    const data = await apiGet('balance_saldos.php?tipo=saldos');
    if (!data) return;

    const tbody = document.getElementById('bsaldos-body');
    const tfoot = document.getElementById('bsaldos-foot');
    if (!tbody) return;

    tbody.innerHTML = data.cuentas.map(c => `
        <tr>
          <td class="amount">${c.codigo}</td>
          <td>${escHtml(c.nombre_cuenta)}</td>
          <td><span class="tag tag-${tipoTag(c.tipo)}">${c.tipo}</span></td>
          <td class="text-end amount-debe">${fmt(c.total_debe)}</td>
          <td class="text-end amount-haber">${fmt(c.total_haber)}</td>
          <td class="text-end ${c.saldo_deudor > 0 ? 'amount-debe' : ''}">${c.saldo_deudor > 0 ? fmt(c.saldo_deudor) : '—'}</td>
          <td class="text-end ${c.saldo_acreedor > 0 ? 'amount-haber' : ''}">${c.saldo_acreedor > 0 ? fmt(c.saldo_acreedor) : '—'}</td>
        </tr>`).join('');

    if (tfoot) {
        const t = data.totales;
        tfoot.innerHTML = `
            <td colspan="3" class="fw-bold text-end">TOTALES</td>
            <td class="text-end fw-bold amount-debe">${fmt(t.debe)}</td>
            <td class="text-end fw-bold amount-haber">${fmt(t.haber)}</td>
            <td class="text-end fw-bold amount-debe">${fmt(t.saldo_deudor)}</td>
            <td class="text-end fw-bold amount-haber">${fmt(t.saldo_acreedor)}</td>`;
    }
}

// ════════════════════════════════════════════════════════════
//  BALANCE AJUSTADO
// ════════════════════════════════════════════════════════════
async function cargarBalanceAjustado() {
    const data = await apiGet('balance_saldos.php?tipo=ajustado');
    if (!data) return;

    const tbody = document.getElementById('bajustado-body');
    if (!tbody) return;

    tbody.innerHTML = data.cuentas.map(c => `
        <tr>
          <td class="amount">${c.codigo}</td>
          <td>${escHtml(c.nombre_cuenta)}</td>
          <td><span class="tag tag-${tipoTag(c.tipo)}">${c.tipo}</span></td>
          <td class="text-end">${fmt(c.saldo_deudor || c.saldo_acreedor)}</td>
          <td class="text-end amount-debe">${c.ajuste_debe > 0 ? fmt(c.ajuste_debe) : '—'}</td>
          <td class="text-end amount-haber">${c.ajuste_haber > 0 ? fmt(c.ajuste_haber) : '—'}</td>
          <td class="text-end fw-bold ${c.saldo_final >= 0 ? 'amount-pos' : 'amount-neg'}">${fmt(Math.abs(c.saldo_final))}</td>
          <td><span class="tag tag-info" style="font-size:11px">${c.clasificacion}</span></td>
        </tr>`).join('');
}

// ════════════════════════════════════════════════════════════
//  NÓMINA
// ════════════════════════════════════════════════════════════
async function cargarNomina() {
    const data = await apiGet('empleados.php');
    if (!data) return;

    const tbody = document.querySelector('#tbl-nomina tbody');
    if (!tbody) return;

    tbody.innerHTML = data.empleados.map((e, i) => {
        const iniciales = e.nombre.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
        const color = ['#1a3c5e','#2980b9','#2d9e6b','#7f8c8d','#8e44ad'][i % 5];
        return `
        <tr>
          <td class="text-center">${i + 1}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="emp-avatar" style="background:${color}">${iniciales}</div>
              <div><div class="fw-600">${escHtml(e.nombre)}</div></div>
            </div>
          </td>
          <td><span class="tag tag-accent">${escHtml(e.puesto)}</span></td>
          <td class="text-end amount">${fmt(e.salario)}</td>
          <td class="text-end amount-neg">${fmt(e.igss_laboral)}</td>
          <td class="text-end amount-pos fw-bold">${fmt(e.salario_neto)}</td>
        </tr>`;
    }).join('');

    // Fila de totales
    const t = data.totales;
    tbody.insertAdjacentHTML('beforeend', `
        <tr class="table-light fw-bold">
          <td colspan="3" class="text-end">TOTALES</td>
          <td class="text-end amount-gold">${fmt(t.salario_bruto)}</td>
          <td class="text-end amount-neg">${fmt(t.igss_laboral)}</td>
          <td class="text-end amount-pos">${fmt(t.salario_neto)}</td>
        </tr>`);
}

// ════════════════════════════════════════════════════════════
//  PRODUCTOS
// ════════════════════════════════════════════════════════════
async function cargarProductos() {
    const productos = await apiGet('productos.php');
    if (!productos) return;

    const tbody = document.getElementById('productos-body');
    if (!tbody) return;

    tbody.innerHTML = productos.map((p, i) => {
        const margen = parseFloat(p.margen_pct);
        const tagColor = margen >= 40 ? 'success' : margen >= 20 ? 'warning' : 'danger';
        return `
        <tr>
          <td>${i + 1}</td>
          <td class="fw-600">${escHtml(p.nombre_producto)}</td>
          <td><span class="tag tag-info">${escHtml(p.descripcion || '—')}</span></td>
          <td>—</td>
          <td class="text-end amount">${fmt(p.precio_compra)}</td>
          <td class="text-end amount-pos">${fmt(p.precio_venta)}</td>
          <td class="text-center">
            <span class="tag tag-${tagColor}">${margen}%</span>
          </td>
        </tr>`;
    }).join('');

    // Inicializar DataTable si jQuery está disponible
    if (typeof $ !== 'undefined' && !$.fn.DataTable.isDataTable('#tbl-productos')) {
        $('#tbl-productos').DataTable({ language: { url: '//cdn.datatables.net/plug-ins/1.13.8/i18n/es-GT.json' } });
    }
}

// ════════════════════════════════════════════════════════════
//  AJUSTES
// ════════════════════════════════════════════════════════════
async function cargarAjustes() {
    const data = await apiGet('ajustes.php');
    if (!data) return;
    // Los ajustes se muestran en las tarjetas stat ya pintadas en el HTML.
    // Si tienes elementos dinámicos adicionales, puedes extender aquí.
    console.log('[Ajustes cargados]', data);
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════
function tipoTag(tipo) {
    const map = { ACTIVO:'success', PASIVO:'danger', CAPITAL:'info', INGRESO:'accent', GASTO:'warning' };
    return map[tipo] || 'primary';
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

// ════════════════════════════════════════════════════════════
//  HOOK: llamar las funciones cuando se cambia de página
//  Integra con la función showPage() de tu scrip.js existente
// ════════════════════════════════════════════════════════════
const _paginasCarga = {
    'dashboard'  : cargarDashboard,
    'diario'     : cargarLibroDiario,
    'mayor'      : cargarLibroMayor,
    'bsaldos'    : cargarBalanceSaldos,
    'bajustado'  : cargarBalanceAjustado,
    'nomina'     : cargarNomina,
    'productos'  : cargarProductos,
    'ajustes'    : cargarAjustes,
};

// Sobreescribe showPage para que cargue datos al cambiar de sección.
// Si tu scrip.js ya define showPage, renómbrala a _showPageOriginal antes de cargar api.js,
// o simplemente pega este bloque al final de scrip.js.
if (typeof showPage === 'function') {
    const _showPageOriginal = showPage;
    window.showPage = function(pageId, btn) {
        _showPageOriginal(pageId, btn);
        if (_paginasCarga[pageId]) {
            _paginasCarga[pageId]();
        }
    };
}

// Carga inicial del dashboard
document.addEventListener('DOMContentLoaded', () => {
    cargarDashboard();
});
