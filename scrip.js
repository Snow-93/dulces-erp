// ═══════════════════════════════════════════════════════════
//  scrip.js — ERP Dulces y Delicias del Valle, S.A.
//  Versión con backend PHP/MySQL (XAMPP)
//  Tu lógica original se mantiene intacta.
//  Las funciones que antes usaban localStorage ahora usan la API.
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// CONFIGURACIÓN API
// Cambia esta URL si tu carpeta en htdocs se llama diferente
// ─────────────────────────────────────────────────────────
const API = 'http://localhost/dulces-erp/erp-backend/api';
// ─────────────────────────────────────────────────────────
// PERÍODO ACTIVO — controlado por el selector del topbar
// ─────────────────────────────────────────────────────────
const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function getPeriodo() {
    const mes  = parseInt(document.getElementById('sel-mes')?.value  || 1);
    const anio = parseInt(document.getElementById('sel-anio')?.value || 2026);
    return { mes, anio };
}

function getPeriodoStr() {
    const { mes, anio } = getPeriodo();
    return `mes=${mes}&anio=${anio}`;
}

function getPeriodoLabel() {
    const { mes, anio } = getPeriodo();
    return `${MESES[mes]} ${anio}`;
}

function cambiarPeriodo() {
    // Actualizar todos los textos de período en el HTML
    document.querySelectorAll('.periodo-label').forEach(el => {
        el.textContent = getPeriodoLabel();
    });
    // Recargar la página activa
    const paginaActiva = document.querySelector('.page.active')?.id?.replace('page-','');
    if (paginaActiva) {
        const loaders = {
            dashboard    : cargarDashboard,
            nuevapartida : cargarNuevaPartida,
            diario       : cargarLibroDiario,
            mayor        : cargarLibroMayor,
            bsaldos      : cargarBalanceSaldos,
            bajustado    : cargarBalanceAjustado,
        };
        if (loaders[paginaActiva]) loaders[paginaActiva]();
    }
}

// ─────────────────────────────────────────────────────────
// TITLES
// ─────────────────────────────────────────────────────────
const titles = {
  dashboard      : 'Dashboard General',
  nuevapartida   : 'Nueva Partida Contable',
  diario         : 'Libro Diario',
  mayor          : 'Libro Mayor',
  bsaldos        : 'Balance de Saldos',
  ajustes        : 'Ajustes Contables',
  bajustado      : 'Balance Ajustado',
  resultados     : 'Estado de Resultados',
  balance        : 'Balance General',
  nomina         : 'Nómina Salarial',
  productos      : 'Catálogo de Productos',
  iva            : 'Obligaciones Tributarias',
  usuarios       : 'Gestión de Usuarios',
};

// ─────────────────────────────────────────────────────────
// UI FUNCTIONS  (sin cambios respecto a tu versión original)
// ─────────────────────────────────────────────────────────
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = titles[id] || id;
  window.scrollTo(0, 0);

  // ← Cargar datos desde MySQL al cambiar de sección
  const loaders = {
    dashboard      : cargarDashboard,
    nuevapartida   : cargarNuevaPartida,
    diario         : cargarLibroDiario,
    mayor          : cargarLibroMayor,
    bsaldos        : cargarBalanceSaldos,
    bajustado      : cargarBalanceAjustado,
    resultados     : cargarEstadoResultados,
    balance        : cargarBalanceGeneral,
    nomina         : cargarNomina,
    productos      : cargarProductos,
    usuarios       : cargarUsuarios,
  };
  if (loaders[id]) loaders[id]();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function printPage() {
  Swal.fire({
    title: '¿Imprimir página actual?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#1a3c5e',
    confirmButtonText: 'Imprimir',
    cancelButtonText: 'Cancelar'
  }).then(r => { if (r.isConfirmed) window.print(); });
}

function exportTableCSV(tableId, filename) {
  Swal.fire({ title: 'Exportando...', timer: 1200, timerProgressBar: true, showConfirmButton: false });
  setTimeout(() => {
    const rows = document.querySelectorAll('#' + tableId + ' tr');
    const csv  = Array.from(rows)
      .map(r => Array.from(r.querySelectorAll('th,td'))
        .map(c => `"${c.innerText.replace(/"/g, '""')}"`)
        .join(','))
      .join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = filename + '.csv';
    a.click();
  }, 400);
}

// ─────────────────────────────────────────────────────────
// HELPERS  (igual que antes)
// ─────────────────────────────────────────────────────────
const q = n => 'Q ' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const tagMap = {
  'Activo'       : 'tag-info',
  'Pasivo'       : 'tag-danger',
  'Patrimonio'   : 'tag-success',
  'Ingreso'      : 'tag-success',
  'Egreso'       : 'tag-accent',
  'Contra-Activo': 'tag-warning'
};

// Mapeo tipo MySQL → clase CSS
function tipoTag(tipo) {
  const map = {
    ACTIVO: 'info', PASIVO: 'danger', CAPITAL: 'success',
    INGRESO: 'accent', GASTO: 'warning'
  };
  return 'tag-' + (map[tipo] || 'primary');
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────
// HELPERS LOCALES  (se mantienen para compatibilidad)
// ─────────────────────────────────────────────────────────
const cuentas  = [];   // se llena desde la API
const partidas = [];   // se llena desde la API

function totalDebe(cuenta)  { return cuenta.debe.reduce((s,e)=>s+e.v, 0); }
function totalHaber(cuenta) { return cuenta.haber.reduce((s,e)=>s+e.v, 0); }
function saldoCuenta(cuenta){ return totalDebe(cuenta) - totalHaber(cuenta); }
function buscarCuenta(code) { return cuentas.find(c => c.code === code); }

// ─────────────────────────────────────────────────────────
// CAPA API  — fetch helpers
// ─────────────────────────────────────────────────────────
async function apiGet(endpoint) {
  try {
    const res  = await fetch(`${API}/${endpoint}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const match = text.match(/[\[{][\s\S]*/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('[GET]', endpoint, err);
    Swal.fire({ icon:'error', title:'Sin conexión', text:'Verifica que XAMPP esté activo.', timer:3500 });
    return null;
  }
}

async function apiPost(endpoint, data) {
  try {
    const res  = await fetch(`${API}/${endpoint}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data)
    });
    const text = await res.text();
    // Extraer solo el JSON aunque PHP imprima warnings antes
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('[POST]', endpoint, err);
    Swal.fire({ icon:'error', title:'Error al guardar', text: String(err) });
    return null;
  }
}

async function apiDelete(endpoint, id) {
  try {
    const res  = await fetch(`${API}/${endpoint}?id=${id}`, { method:'DELETE' });
    const text = await res.text();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('[DELETE]', endpoint, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────
// STORAGE  — ahora guarda en MySQL, no en localStorage
// ─────────────────────────────────────────────────────────
function saveData()  { /* manejado por la API */ }
function loadData()  { /* manejado por la API */ }

// ═══════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════
async function cargarDashboard() {
  const data = await apiGet(`dashboard.php?${getPeriodoStr()}`);
  if (!data) return;

  // Actualizar stat-cards
  const ids = ['stat-capital','stat-ventas','stat-costo','stat-utilidad','stat-gastos','stat-empleados'];
  const vals = [q(data.capital), q(data.ventas), q(data.costo_ventas), q(data.utilidad_bruta), q(data.gastos_totales), String(data.empleados)];
  ids.forEach((id, i) => { const el = document.getElementById(id); if (el) el.textContent = vals[i]; });

  // Actualizar subtítulo planilla
  const elPlan = document.getElementById('stat-planilla');
  if (elPlan) elPlan.textContent = `Planilla ${q(data.planilla)}/mes`;

  // Actualizar etiquetas de período
  document.querySelectorAll('.periodo-label').forEach(el => el.textContent = getPeriodoLabel());

  // Tabla de partidas
  if (data.partidas) {
    const tbody = document.getElementById('dashboard-partidas');
    if (tbody) {
      tbody.innerHTML = data.partidas.length
        ? data.partidas.map((p, i) => `
            <tr>
              <td><span class="tag tag-primary">P-${String(p.id_partida).padStart(2,'0')}</span></td>
              <td>${escHtml(p.descripcion)}</td>
              <td class="text-end amount-debe">${q(p.total_debe)}</td>
              <td class="text-end amount-haber">${q(p.total_haber)}</td>
            </tr>`).join('')
        : `<tr><td colspan="4" class="text-center text-muted py-3">Sin partidas en ${getPeriodoLabel()}</td></tr>`;
    }
  }

  // Actualizar selector con meses que tienen datos
  if (data.meses_disponibles?.length) {
    const selMes  = document.getElementById('sel-mes');
    const selAnio = document.getElementById('sel-anio');
    if (selAnio) {
      const aniosSet = [...new Set(data.meses_disponibles.map(m => m.anio))];
      const anioActual = selAnio.value;
      // Agregar años que falten
      aniosSet.forEach(a => {
        if (![...selAnio.options].find(o => o.value == a)) {
          const opt = document.createElement('option');
          opt.value = a; opt.textContent = a;
          selAnio.appendChild(opt);
        }
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  LIBRO DIARIO  — reemplaza buildPartidas()
// ═══════════════════════════════════════════════════════════
async function cargarLibroDiario() {
  const partidas = await apiGet(`libro_diario.php?${getPeriodoStr()}`);
  if (!partidas) return;

  const container = document.getElementById('partidas-container');
  container.innerHTML = '';

  if (!partidas.length) {
    container.innerHTML = `<div class="alert alert-info">No hay partidas registradas aún.
      <button class="btn btn-sm btn-primary ms-3" onclick="abrirModalPartida()">
        <i class="bi bi-plus-circle"></i> Crear primera partida
      </button></div>`;
    return;
  }

  // Reutiliza el estilo original de buildPartidas()
  partidas.forEach(p => {
    const rows = p.lineas.map(l => `
      <tr>
        <td>${l.codigo}</td>
        <td>${escHtml(l.nombre_cuenta)}</td>
        <td class="text-end">${l.debe > 0 ? q(l.debe) : '—'}</td>
        <td class="text-end">${l.haber > 0 ? q(l.haber) : '—'}</td>
      </tr>`).join('');

    container.innerHTML += `
      <div class="partida-wrap">
        <div class="partida-header">
          <div>
            <span class="partida-num">P-${String(p.id_partida).padStart(2,'0')}</span>
            <div class="partida-title">${escHtml(p.descripcion)}</div>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="partida-date">${p.fecha}</div>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarPartida(${p.id_partida})" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <table class="table">
          <thead>
            <tr><th>Código</th><th>Cuenta</th><th class="text-end">Debe</th><th class="text-end">Haber</th></tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <th colspan="2">Totales</th>
              <th class="text-end">${q(p.total_debe)}</th>
              <th class="text-end">${q(p.total_haber)}</th>
            </tr>
          </tfoot>
        </table>
      </div>`;
  });

  // Botón de nueva partida al final
  container.insertAdjacentHTML('beforeend', `
    <div class="text-end mt-3">
      <button class="btn btn-primary" onclick="abrirModalPartida()">
        <i class="bi bi-plus-circle me-1"></i>Nueva Partida
      </button>
    </div>`);
}

// ─────────────────────────────────────────────────────────
// ELIMINAR PARTIDA
// ─────────────────────────────────────────────────────────
async function eliminarPartida(id) {
  const confirm = await Swal.fire({
    title: '¿Eliminar partida?',
    text: `Se eliminará la partida #${id} y todos sus registros.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b'
  });
  if (!confirm.isConfirmed) return;

  const res = await apiDelete('libro_diario.php', id);
  if (res?.ok) {
    Swal.fire({ icon:'success', title:'Partida eliminada', timer:1500, showConfirmButton:false });
    cargarLibroDiario();
  }
}

// ─────────────────────────────────────────────────────────
// MODAL NUEVA PARTIDA
// ─────────────────────────────────────────────────────────
async function abrirModalPartida() {
  const cuentasDB = await apiGet('cuentas.php');
  if (!cuentasDB) return;

  const opts = cuentasDB.map(c =>
    `<option value="${c.id_cuenta}">${c.codigo} — ${c.nombre_cuenta}</option>`
  ).join('');

  const lineaHtml = () => `
    <div class="fila-linea d-flex gap-2 mb-2 align-items-center">
      <select class="form-select form-select-sm sel-cuenta" style="flex:3">${opts}</select>
      <input type="number" class="form-control form-control-sm inp-debe"  placeholder="Debe"  step="0.01" min="0" style="flex:1.3">
      <input type="number" class="form-control form-control-sm inp-haber" placeholder="Haber" step="0.01" min="0" style="flex:1.3">
      <button type="button" class="btn btn-sm btn-outline-danger px-1"
        onclick="this.closest('.fila-linea').remove()">
        <i class="bi bi-x"></i>
      </button>
    </div>`;

  const { value: form } = await Swal.fire({
    title: '<i class="bi bi-journal-plus"></i> Nueva Partida Contable',
    width: 720,
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="row g-2 mb-3">
          <div class="col-5">
            <label class="form-label fw-bold mb-1">Fecha</label>
            <input id="sw-fecha" type="date" class="form-control"
              value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="col-7">
            <label class="form-label fw-bold mb-1">Concepto / Descripción</label>
            <input id="sw-desc" type="text" class="form-control"
              placeholder="Ej: Venta de mercadería al contado">
          </div>
        </div>
        <label class="form-label fw-bold mb-1">Líneas contables</label>
        <div id="sw-lineas">
          ${lineaHtml()}
          ${lineaHtml()}
        </div>
        <button type="button" class="btn btn-sm btn-outline-primary mt-1"
          onclick="document.getElementById('sw-lineas').insertAdjacentHTML('beforeend',
            \`${lineaHtml().replace(/`/g,'\\`').replace(/\n\s*/g,' ')}\`)">
          <i class="bi bi-plus"></i> Agregar línea
        </button>
        <div id="sw-resumen" class="mt-3 p-2 rounded" style="background:var(--surface-2);font-size:13px">
          Completa las líneas para ver el resumen de cuadre.
        </div>
      </div>`,
    confirmButtonText  : '<i class="bi bi-save"></i> Guardar partida',
    cancelButtonText   : 'Cancelar',
    showCancelButton   : true,
    confirmButtonColor : '#1a3c5e',
    didOpen: () => {
      // Mostrar resumen de cuadre en tiempo real
      document.getElementById('sw-lineas').addEventListener('input', actualizarResumen);
    },
    preConfirm: () => {
      const fecha = document.getElementById('sw-fecha').value;
      const desc  = document.getElementById('sw-desc').value.trim();
      if (!fecha || !desc) {
        Swal.showValidationMessage('Completa la fecha y el concepto.');
        return false;
      }
      const lineas = [];
      document.querySelectorAll('.fila-linea').forEach(f => {
        const id_cuenta = parseInt(f.querySelector('.sel-cuenta').value);
        const debe      = parseFloat(f.querySelector('.inp-debe').value)  || 0;
        const haber     = parseFloat(f.querySelector('.inp-haber').value) || 0;
        if (id_cuenta && (debe > 0 || haber > 0)) {
          lineas.push({ id_cuenta, debe, haber });
        }
      });
      if (lineas.length < 2) {
        Swal.showValidationMessage('Agrega al menos 2 líneas con valores.');
        return false;
      }
      const sumD = lineas.reduce((s,l)=>s+l.debe, 0);
      const sumH = lineas.reduce((s,l)=>s+l.haber, 0);
      if (Math.abs(sumD - sumH) > 0.01) {
        Swal.showValidationMessage(`La partida no cuadra: Debe ${q(sumD)} ≠ Haber ${q(sumH)}`);
        return false;
      }
      return { fecha, descripcion: desc, lineas };
    }
  });

  if (form) {
    const res = await apiPost('libro_diario.php', form);
    if (res?.ok) {
      Swal.fire({
        icon: 'success',
        title: `Partida P-${String(res.id_partida).padStart(2,'0')} guardada`,
        timer: 1800,
        showConfirmButton: false
      });
      cargarLibroDiario();
    } else if (res?.mensaje) {
      Swal.fire({ icon:'error', title:'Error contable', text: res.mensaje });
    }
  }
}

function actualizarResumen() {
  let sumD = 0, sumH = 0;
  document.querySelectorAll('.fila-linea').forEach(f => {
    sumD += parseFloat(f.querySelector('.inp-debe').value)  || 0;
    sumH += parseFloat(f.querySelector('.inp-haber').value) || 0;
  });
  const ok  = Math.abs(sumD - sumH) < 0.01;
  const div = document.getElementById('sw-resumen');
  if (!div) return;
  div.style.color      = ok ? 'var(--success)' : 'var(--danger)';
  div.style.fontWeight = '600';
  div.innerHTML = ok
    ? `<i class="bi bi-check-circle-fill"></i> Partida cuadra — Debe: ${q(sumD)} = Haber: ${q(sumH)}`
    : `<i class="bi bi-exclamation-triangle-fill"></i> No cuadra — Debe: ${q(sumD)} | Haber: ${q(sumH)} | Diferencia: ${q(Math.abs(sumD-sumH))}`;
}

// ═══════════════════════════════════════════════════════════
//  LIBRO MAYOR  — reemplaza buildMayor()
// ═══════════════════════════════════════════════════════════
async function cargarLibroMayor() {
  const cuentas = await apiGet(`libro_mayor.php?${getPeriodoStr()}`);
  if (!cuentas) return;

  const grid = document.getElementById('mayorGrid');
  grid.innerHTML = '';

  cuentas.forEach(c => {
    const esDeudor = c.naturaleza === 'DEUDOR';
    grid.innerHTML += `
      <div class="mayor-card">
        <div class="mayor-card-head">
          <span>${escHtml(c.nombre_cuenta)}</span>
          <span>${c.codigo}</span>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:4px 6px;text-align:left">Ref.</th>
              <th style="padding:4px 6px;text-align:right">Debe</th>
              <th style="padding:4px 6px;text-align:right">Haber</th>
            </tr>
          </thead>
          <tbody>
            ${c.movimientos.map(m => `
              <tr>
                <td style="padding:3px 6px;max-width:110px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"
                    title="${escHtml(m.descripcion)}">${escHtml(m.descripcion)}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--info)">${m.debe > 0 ? q(m.debe) : ''}</td>
                <td style="padding:3px 6px;text-align:right;color:var(--danger)">${m.haber > 0 ? q(m.haber) : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="mayor-foot">
          <span>${esDeudor ? 'Saldo Deudor' : 'Saldo Acreedor'}</span>
          <span>${q(c.saldo)}</span>
        </div>
      </div>`;
  });
}

// ═══════════════════════════════════════════════════════════
//  BALANCE DE SALDOS  — reemplaza buildBalanceSaldos()
// ═══════════════════════════════════════════════════════════
async function cargarBalanceSaldos() {
  const data = await apiGet(`balance_saldos.php?tipo=saldos&${getPeriodoStr()}`);
  if (!data) return;

  const body  = document.getElementById('bsaldos-body');
  const tfoot = document.getElementById('bsaldos-foot');
  body.innerHTML = '';

  data.cuentas.forEach(c => {
    body.innerHTML += `
      <tr>
        <td>${c.codigo}</td>
        <td>${escHtml(c.nombre_cuenta)}</td>
        <td><span class="${tipoTag(c.tipo)}">${c.tipo}</span></td>
        <td class="text-end">${c.total_debe  ? q(c.total_debe)  : '—'}</td>
        <td class="text-end">${c.total_haber ? q(c.total_haber) : '—'}</td>
        <td class="text-end">${c.saldo_deudor   > 0 ? q(c.saldo_deudor)   : '—'}</td>
        <td class="text-end">${c.saldo_acreedor > 0 ? q(c.saldo_acreedor) : '—'}</td>
      </tr>`;
  });

  const t = data.totales;
  tfoot.innerHTML = `
    <tr>
      <th colspan="3">TOTALES</th>
      <th class="text-end">${q(t.debe)}</th>
      <th class="text-end">${q(t.haber)}</th>
      <th class="text-end">${q(t.saldo_deudor)}</th>
      <th class="text-end">${q(t.saldo_acreedor)}</th>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════
//  BALANCE AJUSTADO
// ═══════════════════════════════════════════════════════════
async function cargarBalanceAjustado() {
  const data = await apiGet(`balance_saldos.php?tipo=ajustado&${getPeriodoStr()}`);
  if (!data) return;

  const body = document.getElementById('bajustado-body');
  body.innerHTML = '';

  data.cuentas.forEach(c => {
    const saldoBase = c.saldo_deudor || c.saldo_acreedor || 0;
    const final     = parseFloat(c.saldo_final) || saldoBase;
    body.innerHTML += `
      <tr>
        <td>${c.codigo}</td>
        <td>${escHtml(c.nombre_cuenta)}</td>
        <td><span class="${tipoTag(c.tipo)}">${c.tipo}</span></td>
        <td class="text-end">${q(saldoBase)}</td>
        <td class="text-end">${c.ajuste_debe  > 0 ? q(c.ajuste_debe)  : '—'}</td>
        <td class="text-end">${c.ajuste_haber > 0 ? q(c.ajuste_haber) : '—'}</td>
        <td class="text-end fw-bold ${final >= 0 ? 'amount-pos' : 'amount-neg'}">
          ${q(Math.abs(final))}
        </td>
        <td><span class="tag tag-info" style="font-size:11px">${c.clasificacion || '—'}</span></td>
      </tr>`;
  });
}

// ═══════════════════════════════════════════════════════════
//  NÓMINA  — carga desde MySQL y reutiliza la tabla del HTML
// ═══════════════════════════════════════════════════════════
async function cargarNomina() {
  const data = await apiGet('empleados.php');
  if (!data) return;

  const tbody = document.querySelector('#tbl-nomina tbody');
  if (!tbody) return;

  const colores = [
    'linear-gradient(135deg,#1a3c5e,#234f7a)',
    'linear-gradient(135deg,#2980b9,#3498db)',
    'linear-gradient(135deg,#2d9e6b,#27ae60)',
    'linear-gradient(135deg,#7f8c8d,#95a5a6)',
    'linear-gradient(135deg,#8e44ad,#9b59b6)'
  ];

  tbody.innerHTML = data.empleados.map((e, i) => {
    const iniciales = e.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    return `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="emp-avatar" style="background:${colores[i % 5]}">${iniciales}</div>
            <div><div class="fw-600">${escHtml(e.nombre)}</div></div>
          </div>
        </td>
        <td><span class="tag tag-accent">${escHtml(e.puesto)}</span></td>
        <td class="text-end amount">${q(e.salario)}</td>
        <td class="text-end amount-neg">${q(e.igss_laboral)}</td>
        <td class="text-end amount-pos fw-bold">${q(e.salario_neto)}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editarEmpleado(${e.id_empleado})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarEmpleado(${e.id_empleado}, '${escHtml(e.nombre)}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');

  // Fila de totales
  const t = data.totales;
  tbody.insertAdjacentHTML('beforeend', `
    <tr class="table-light fw-bold">
      <td colspan="3" class="text-end">TOTALES</td>
      <td class="text-end amount-gold">${q(t.salario_bruto)}</td>
      <td class="text-end amount-neg">${q(t.igss_laboral)}</td>
      <td class="text-end amount-pos">${q(t.salario_neto)}</td>
      <td></td>
    </tr>`);

  // Actualizar stat cards de nómina
  const elEmp   = document.getElementById('nom-total-emp');
  const elBruto = document.getElementById('nom-total-bruto');
  const elIgss  = document.getElementById('nom-igss-pat');
  const elCosto = document.getElementById('nom-costo-total');
  if (elEmp)   elEmp.textContent   = data.empleados.length;
  if (elBruto) elBruto.textContent = q(t.salario_bruto);
  if (elIgss)  elIgss.textContent  = q(t.igss_patronal);
  if (elCosto) elCosto.textContent = q(t.costo_total);
}

// ═══════════════════════════════════════════════════════════
//  PRODUCTOS  — carga catálogo desde MySQL
// ═══════════════════════════════════════════════════════════
async function cargarProductos() {
  const productos = await apiGet('productos.php');
  if (!productos) return;

  const tbody = document.getElementById('productos-body');
  if (!tbody) return;

  if (!productos.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
      No hay productos. <button class="btn btn-sm btn-primary ms-2" onclick="abrirModalProducto()">
      <i class="bi bi-plus-circle"></i> Agregar producto</button></td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map((p, i) => {
    const margen   = parseFloat(p.margen_pct) || 0;
    const tagColor = margen >= 40 ? 'success' : margen >= 20 ? 'warning' : 'danger';
    return `
      <tr>
        <td>${i + 1}</td>
        <td class="fw-600">${escHtml(p.nombre_producto)}</td>
        <td><span class="tag tag-info">${escHtml(p.descripcion || '—')}</span></td>
        <td>${p.stock} uds.</td>
        <td class="text-end amount">${q(p.precio_compra)}</td>
        <td class="text-end amount-pos">${q(p.precio_venta)}</td>
        <td class="text-center"><span class="tag tag-${tagColor}">${margen}%</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" onclick="editarProducto(${p.id_producto})" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id_producto}, '${escHtml(p.nombre_producto)}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');

  // Inicializar DataTable
  if (typeof $ !== 'undefined' && $.fn.DataTable) {
    if ($.fn.DataTable.isDataTable('#tbl-productos')) {
      $('#tbl-productos').DataTable().destroy();
    }
    $('#tbl-productos').DataTable({
      language: { search:'Buscar:', lengthMenu:'Mostrar _MENU_ registros', info:'_START_-_END_ de _TOTAL_', zeroRecords:'Sin resultados' }
    });
  }
}

// Modal de nuevo producto
async function abrirModalProducto() {
  const { value: form } = await Swal.fire({
    title: '<i class="bi bi-bag-plus"></i> Nuevo Producto',
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="mb-2">
          <label class="form-label fw-bold">Nombre</label>
          <input id="prd-nombre" class="form-control" placeholder="Ej: Chocolate Abuelita 33g">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Categoría / Descripción</label>
          <input id="prd-desc" class="form-control" placeholder="Ej: Chocolates">
        </div>
        <div class="row g-2 mb-2">
          <div class="col-4">
            <label class="form-label fw-bold">P. Compra (Q)</label>
            <input id="prd-compra" type="number" class="form-control" step="0.01" min="0">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">P. Venta (Q)</label>
            <input id="prd-venta" type="number" class="form-control" step="0.01" min="0">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">Stock</label>
            <input id="prd-stock" type="number" class="form-control" min="0" value="0">
          </div>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1a3c5e',
    preConfirm: () => {
      const nombre  = document.getElementById('prd-nombre').value.trim();
      const compra  = parseFloat(document.getElementById('prd-compra').value) || 0;
      const venta   = parseFloat(document.getElementById('prd-venta').value)  || 0;
      if (!nombre || !compra || !venta) {
        Swal.showValidationMessage('Nombre, precio de compra y venta son obligatorios.');
        return false;
      }
      return {
        nombre_producto: nombre,
        descripcion    : document.getElementById('prd-desc').value.trim(),
        precio_compra  : compra,
        precio_venta   : venta,
        costo          : compra,
        stock          : parseInt(document.getElementById('prd-stock').value) || 0,
        aplica_iva     : 1
      };
    }
  });

  if (form) {
    const res = await apiPost('productos.php', form);
    if (res?.ok) {
      Swal.fire({ icon:'success', title:'Producto guardado', timer:1500, showConfirmButton:false });
      cargarProductos();
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  MODAL NUEVO / EDITAR EMPLEADO
// ═══════════════════════════════════════════════════════════
async function abrirModalEmpleado(empleado = null) {
  const editando = empleado !== null;
  const { value: form } = await Swal.fire({
    title: editando ? '<i class="bi bi-pencil"></i> Editar Empleado' : '<i class="bi bi-person-plus"></i> Nuevo Empleado',
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="row g-2 mb-2">
          <div class="col-8">
            <label class="form-label fw-bold">Nombre completo</label>
            <input id="emp-nombre" class="form-control" value="${escHtml(empleado?.nombre || '')}" placeholder="Ej: Juan López Pérez">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">DPI</label>
            <input id="emp-dpi" class="form-control" value="${escHtml(empleado?.dpi || '')}" placeholder="0000000000000">
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-8">
            <label class="form-label fw-bold">Puesto</label>
            <input id="emp-puesto" class="form-control" value="${escHtml(empleado?.puesto || '')}" placeholder="Ej: Vendedor">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">Salario (Q)</label>
            <input id="emp-salario" type="number" class="form-control" value="${empleado?.salario || ''}" step="0.01" min="0">
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-6">
            <label class="form-label fw-bold">Bonificación (Q)</label>
            <input id="emp-bonificacion" type="number" class="form-control" value="${empleado?.bonificacion || 250}" step="0.01" min="0">
          </div>
          <div class="col-6">
            <label class="form-label fw-bold">Fecha de Ingreso</label>
            <input id="emp-fecha" type="date" class="form-control" value="${empleado?.fecha_ingreso || new Date().toISOString().split('T')[0]}">
          </div>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: editando ? 'Actualizar' : 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1a3c5e',
    preConfirm: () => {
      const nombre  = document.getElementById('emp-nombre').value.trim();
      const salario = parseFloat(document.getElementById('emp-salario').value) || 0;
      if (!nombre || !salario) {
        Swal.showValidationMessage('Nombre y salario son obligatorios.');
        return false;
      }
      return {
        nombre,
        dpi          : document.getElementById('emp-dpi').value.trim(),
        puesto       : document.getElementById('emp-puesto').value.trim(),
        salario,
        igss         : salario * 0.0483,
        bonificacion : parseFloat(document.getElementById('emp-bonificacion').value) || 250,
        fecha_ingreso: document.getElementById('emp-fecha').value,
      };
    }
  });

  if (!form) return;

  let res;
  if (editando) {
    res = await apiPut('empleados.php', empleado.id_empleado, form);
  } else {
    res = await apiPost('empleados.php', form);
  }

  if (res?.ok) {
    Swal.fire({ icon:'success', title: editando ? 'Empleado actualizado' : 'Empleado guardado', timer:1500, showConfirmButton:false });
    cargarNomina();
  }
}

async function editarEmpleado(id) {
  const data = await apiGet('empleados.php');
  if (!data) return;
  const emp = data.empleados.find(e => e.id_empleado == id);
  if (emp) abrirModalEmpleado(emp);
}

async function eliminarEmpleado(id, nombre) {
  const confirm = await Swal.fire({
    title: '¿Eliminar empleado?',
    text: nombre,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b'
  });
  if (!confirm.isConfirmed) return;
  const res = await apiDelete('empleados.php', id);
  if (res?.ok) {
    Swal.fire({ icon:'success', title:'Empleado eliminado', timer:1400, showConfirmButton:false });
    cargarNomina();
  }
}

async function apiPut(endpoint, id, data) {
  try {
    const res  = await fetch(`${API}/${endpoint}?id=${id}`, {
      method : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(data)
    });
    const text = await res.text();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (err) {
    console.error('[PUT]', endpoint, err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
//  EDITAR / ELIMINAR PRODUCTO
// ═══════════════════════════════════════════════════════════
async function editarProducto(id) {
  const productos = await apiGet('productos.php');
  if (!productos) return;
  const p = productos.find(x => x.id_producto == id);
  if (!p) return;

  const { value: form } = await Swal.fire({
    title: '<i class="bi bi-pencil"></i> Editar Producto',
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="mb-2">
          <label class="form-label fw-bold">Nombre</label>
          <input id="prd-nombre" class="form-control" value="${escHtml(p.nombre_producto)}">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Categoría</label>
          <input id="prd-desc" class="form-control" value="${escHtml(p.descripcion || '')}">
        </div>
        <div class="row g-2">
          <div class="col-4">
            <label class="form-label fw-bold">P. Compra (Q)</label>
            <input id="prd-compra" type="number" class="form-control" value="${p.precio_compra}" step="0.01">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">P. Venta (Q)</label>
            <input id="prd-venta" type="number" class="form-control" value="${p.precio_venta}" step="0.01">
          </div>
          <div class="col-4">
            <label class="form-label fw-bold">Stock</label>
            <input id="prd-stock" type="number" class="form-control" value="${p.stock}" min="0">
          </div>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1a3c5e',
    preConfirm: () => {
      const nombre = document.getElementById('prd-nombre').value.trim();
      const compra = parseFloat(document.getElementById('prd-compra').value) || 0;
      const venta  = parseFloat(document.getElementById('prd-venta').value)  || 0;
      if (!nombre || !compra || !venta) {
        Swal.showValidationMessage('Nombre y precios son obligatorios.');
        return false;
      }
      return {
        nombre_producto: nombre,
        descripcion    : document.getElementById('prd-desc').value.trim(),
        precio_compra  : compra,
        precio_venta   : venta,
        costo          : compra,
        stock          : parseInt(document.getElementById('prd-stock').value) || 0,
        aplica_iva     : 1
      };
    }
  });

  if (form) {
    const res = await apiPut('productos.php', id, form);
    if (res?.ok) {
      Swal.fire({ icon:'success', title:'Producto actualizado', timer:1400, showConfirmButton:false });
      cargarProductos();
    }
  }
}

async function eliminarProducto(id, nombre) {
  const confirm = await Swal.fire({
    title: '¿Eliminar producto?',
    text: nombre,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b'
  });
  if (!confirm.isConfirmed) return;
  const res = await apiDelete('productos.php', id);
  if (res?.ok) {
    Swal.fire({ icon:'success', title:'Producto eliminado', timer:1400, showConfirmButton:false });
    cargarProductos();
  }
}

// ─────────────────────────────────────────────────────────
// COMPATIBILIDAD: buildPartidas / buildMayor / buildBalanceSaldos
// Se mantienen por si algo los llama directamente
// ─────────────────────────────────────────────────────────
function buildPartidas()      { cargarLibroDiario(); }
function buildMayor()         { cargarLibroMayor(); }
function buildBalanceSaldos() { cargarBalanceSaldos(); }
function buildBalanceAjustado(){ cargarBalanceAjustado(); }
function refrescarSistema()   {
  cargarLibroDiario();
  cargarLibroMayor();
  cargarBalanceSaldos();
  cargarBalanceAjustado();
}

// ═══════════════════════════════════════════════════════════
//  PÁGINA NUEVA PARTIDA
// ═══════════════════════════════════════════════════════════

let _cuentasCache = [];   // cache de cuentas para no pedir la API cada vez
let _lineaCounter = 0;    // contador para IDs únicos de cada fila

async function iniciarPaginaNuevaPartida() {
  // Poner fecha de hoy por defecto
  const hoy = new Date().toISOString().split('T')[0];
  const fechaInput = document.getElementById('np-fecha');
  if (fechaInput && !fechaInput.value) fechaInput.value = hoy;

  // Cargar cuentas si no están en cache
  if (!_cuentasCache.length) {
    const data = await apiGet('cuentas.php');
    if (data) _cuentasCache = data;
  }

  // Renderizar lista de cuentas en el panel lateral
  renderizarListaCuentas(_cuentasCache);

  // Agregar 2 líneas iniciales si la tabla está vacía
  const tbody = document.getElementById('np-lineas');
  if (tbody && !tbody.children.length) {
    agregarLineaPartida();
    agregarLineaPartida();
  }

  // Cargar partidas recientes
  cargarPartidasRecientes();
}

// ─────────────────────────────────────────────────────────
// LISTA DE CUENTAS (panel lateral)
// ─────────────────────────────────────────────────────────
function renderizarListaCuentas(cuentas) {
  const lista = document.getElementById('np-lista-cuentas');
  if (!lista) return;

  const tipoColor = { ACTIVO:'info', PASIVO:'danger', CAPITAL:'success', INGRESO:'accent', GASTO:'warning' };

  lista.innerHTML = cuentas.map(c => `
    <div class="np-cuenta-item d-flex justify-content-between align-items-center px-2 py-1 mb-1 rounded"
      style="cursor:pointer;border:1px solid var(--border);transition:background .15s"
      onmouseover="this.style.background='#f0f4f8'"
      onmouseout="this.style.background=''"
      onclick="agregarLineaConCuenta(${c.id_cuenta}, '${escHtml(c.codigo)}', '${escHtml(c.nombre_cuenta)}')">
      <div>
        <span class="amount" style="font-size:12px">${c.codigo}</span>
        <span class="ms-2" style="font-size:12px">${escHtml(c.nombre_cuenta)}</span>
      </div>
      <span class="tag tag-${tipoColor[c.tipo] || 'primary'}" style="font-size:10px">${c.tipo}</span>
    </div>`).join('');
}

function filtrarCuentasSidebar() {
  const busqueda = document.getElementById('np-buscar-cuenta').value.toLowerCase();
  const filtradas = _cuentasCache.filter(c =>
    c.codigo.toLowerCase().includes(busqueda) ||
    c.nombre_cuenta.toLowerCase().includes(busqueda)
  );
  renderizarListaCuentas(filtradas);
}

// ─────────────────────────────────────────────────────────
// AGREGAR LÍNEAS A LA TABLA
// ─────────────────────────────────────────────────────────
function agregarLineaPartida(idCuenta = '', codigoCuenta = '', nombreCuenta = '') {
  const tbody   = document.getElementById('np-lineas');
  const numFila = tbody.children.length + 1;
  const uid     = ++_lineaCounter;

  // Opciones del select de cuentas
  const opts = _cuentasCache.map(c =>
    `<option value="${c.id_cuenta}" ${c.id_cuenta == idCuenta ? 'selected' : ''}>
      ${c.codigo} — ${c.nombre_cuenta}
    </option>`
  ).join('');

  const tr = document.createElement('tr');
  tr.id = `linea-${uid}`;
  tr.innerHTML = `
    <td class="text-center text-muted" style="font-size:12px">${numFila}</td>
    <td>
      <select class="form-select form-select-sm np-sel-cuenta"
        onchange="recalcularCuadre()" style="font-size:13px">
        <option value="">— Selecciona una cuenta —</option>
        ${opts}
      </select>
    </td>
    <td>
      <input type="number" class="form-control form-control-sm text-end np-inp-debe"
        placeholder="0.00" step="0.01" min="0"
        oninput="recalcularCuadre()" style="font-family:var(--font-serif)">
    </td>
    <td>
      <input type="number" class="form-control form-control-sm text-end np-inp-haber"
        placeholder="0.00" step="0.01" min="0"
        oninput="recalcularCuadre()" style="font-family:var(--font-serif)">
    </td>
    <td class="text-center">
      <button class="btn btn-sm btn-outline-danger px-2" onclick="eliminarLineaPartida('linea-${uid}')" title="Quitar">
        <i class="bi bi-x-lg"></i>
      </button>
    </td>`;

  tbody.appendChild(tr);
  recalcularCuadre();
}

function agregarLineaConCuenta(idCuenta, codigo, nombre) {
  // Si ya existe una línea vacía, la reutiliza; si no, crea una nueva
  const vacias = document.querySelectorAll('.np-sel-cuenta');
  for (const sel of vacias) {
    if (!sel.value) {
      sel.value = idCuenta;
      sel.closest('tr').querySelector('.np-inp-debe').focus();
      recalcularCuadre();
      return;
    }
  }
  agregarLineaPartida(idCuenta, codigo, nombre);
  // Hacer foco en el campo debe de la nueva línea
  setTimeout(() => {
    const filas = document.querySelectorAll('#np-lineas tr');
    if (filas.length) filas[filas.length - 1].querySelector('.np-inp-debe').focus();
  }, 50);
}

function eliminarLineaPartida(id) {
  const tr = document.getElementById(id);
  if (tr) {
    tr.remove();
    // Renumerar filas
    document.querySelectorAll('#np-lineas tr').forEach((r, i) => {
      r.querySelector('td:first-child').textContent = i + 1;
    });
    recalcularCuadre();
  }
}

// ─────────────────────────────────────────────────────────
// RECALCULAR CUADRE EN TIEMPO REAL
// ─────────────────────────────────────────────────────────
function recalcularCuadre() {
  let sumaDebe = 0, sumaHaber = 0;

  document.querySelectorAll('#np-lineas tr').forEach(tr => {
    sumaDebe  += parseFloat(tr.querySelector('.np-inp-debe')?.value)  || 0;
    sumaHaber += parseFloat(tr.querySelector('.np-inp-haber')?.value) || 0;
  });

  const diff   = Math.abs(sumaDebe - sumaHaber);
  const cuadra = diff < 0.01 && (sumaDebe > 0 || sumaHaber > 0);

  // Actualizar totales en el tfoot
  document.getElementById('np-total-debe').textContent  = q(sumaDebe);
  document.getElementById('np-total-haber').textContent = q(sumaHaber);

  // Actualizar panel de cuadre
  document.getElementById('np-panel-debe').textContent  = q(sumaDebe);
  document.getElementById('np-panel-haber').textContent = q(sumaHaber);
  document.getElementById('np-panel-diff').textContent  = q(diff);

  const estadoEl = document.getElementById('np-estado-cuadre');
  const panelEl  = document.getElementById('np-cuadre-panel');

  if (sumaDebe === 0 && sumaHaber === 0) {
    estadoEl.innerHTML = `<span class="tag tag-warning"><i class="bi bi-hourglass-split me-1"></i>Pendiente</span>`;
    panelEl.style.borderColor = 'var(--border)';
    document.getElementById('np-panel-diff').style.color = 'var(--text-muted)';
  } else if (cuadra) {
    estadoEl.innerHTML = `<span class="tag tag-success"><i class="bi bi-check-circle-fill me-1"></i>¡Partida cuadrada!</span>`;
    panelEl.style.borderColor = 'var(--success)';
    panelEl.style.background  = 'rgba(45,158,107,0.07)';
    document.getElementById('np-panel-diff').style.color = 'var(--success)';
  } else {
    estadoEl.innerHTML = `<span class="tag tag-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>No cuadra (${q(diff)})</span>`;
    panelEl.style.borderColor = 'var(--danger)';
    panelEl.style.background  = 'rgba(192,57,43,0.06)';
    document.getElementById('np-panel-diff').style.color = 'var(--danger)';
  }
}

// ─────────────────────────────────────────────────────────
// PREVISUALIZAR PARTIDA
// ─────────────────────────────────────────────────────────
function previsualizarPartida() {
  const { fecha, concepto, lineas, sumaDebe, sumaHaber } = recogerDatosFormulario();

  if (!fecha || !concepto || !lineas.length) {
    Swal.fire({ icon:'warning', title:'Formulario incompleto', text:'Completa fecha, concepto y al menos una línea.' });
    return;
  }

  const filas = lineas.map(l => {
    const cuenta = _cuentasCache.find(c => c.id_cuenta == l.id_cuenta);
    return `<tr>
      <td>${cuenta?.codigo || '—'}</td>
      <td>${escHtml(cuenta?.nombre_cuenta || '—')}</td>
      <td class="text-end amount-debe">${l.debe > 0 ? q(l.debe) : '—'}</td>
      <td class="text-end amount-haber">${l.haber > 0 ? q(l.haber) : '—'}</td>
    </tr>`;
  }).join('');

  const cuadra = Math.abs(sumaDebe - sumaHaber) < 0.01;

  Swal.fire({
    title: 'Vista previa de la partida',
    width: 640,
    html: `
      <div style="text-align:left;font-size:13px">
        <div class="d-flex gap-4 mb-3">
          <div><span class="text-muted">Fecha:</span> <strong>${fecha}</strong></div>
          <div><span class="text-muted">Concepto:</span> <strong>${escHtml(concepto)}</strong></div>
        </div>
        <table class="table table-bordered table-sm mb-2">
          <thead style="background:#f5f7fa">
            <tr><th>Código</th><th>Cuenta</th><th class="text-end">Debe</th><th class="text-end">Haber</th></tr>
          </thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="fw-bold">
              <td colspan="2" class="text-end">TOTALES</td>
              <td class="text-end amount-debe">${q(sumaDebe)}</td>
              <td class="text-end amount-haber">${q(sumaHaber)}</td>
            </tr>
          </tfoot>
        </table>
        <div class="text-center mt-2">
          ${cuadra
            ? `<span class="tag tag-success fs-6"><i class="bi bi-check-circle-fill me-1"></i>Partida cuadrada correctamente</span>`
            : `<span class="tag tag-danger fs-6"><i class="bi bi-exclamation-triangle-fill me-1"></i>La partida NO cuadra</span>`}
        </div>
      </div>`,
    confirmButtonText : 'Cerrar',
    confirmButtonColor: '#1a3c5e',
  });
}

// ─────────────────────────────────────────────────────────
// RECOGER DATOS DEL FORMULARIO
// ─────────────────────────────────────────────────────────
function recogerDatosFormulario() {
  const fecha    = document.getElementById('np-fecha')?.value   || '';
  const concepto = document.getElementById('np-concepto')?.value.trim() || '';
  const lineas   = [];
  let sumaDebe = 0, sumaHaber = 0;

  document.querySelectorAll('#np-lineas tr').forEach(tr => {
    const id_cuenta = parseInt(tr.querySelector('.np-sel-cuenta')?.value) || 0;
    const debe      = parseFloat(tr.querySelector('.np-inp-debe')?.value)  || 0;
    const haber     = parseFloat(tr.querySelector('.np-inp-haber')?.value) || 0;
    if (id_cuenta && (debe > 0 || haber > 0)) {
      lineas.push({ id_cuenta, debe, haber });
      sumaDebe  += debe;
      sumaHaber += haber;
    }
  });

  return { fecha, concepto, lineas, sumaDebe, sumaHaber };
}

// ─────────────────────────────────────────────────────────
// GUARDAR PARTIDA
// ─────────────────────────────────────────────────────────
async function guardarPartidaNueva() {
  const { fecha, concepto, lineas, sumaDebe, sumaHaber } = recogerDatosFormulario();

  // Validaciones
  if (!fecha) {
    Swal.fire({ icon:'warning', title:'Falta la fecha', text:'Selecciona una fecha para la partida.' });
    return;
  }
  if (!concepto) {
    Swal.fire({ icon:'warning', title:'Falta el concepto', text:'Escribe una descripción para la partida.' });
    return;
  }
  if (lineas.length < 2) {
    Swal.fire({ icon:'warning', title:'Pocas líneas', text:'Una partida necesita al menos 2 líneas contables.' });
    return;
  }
  if (Math.abs(sumaDebe - sumaHaber) > 0.01) {
    Swal.fire({
      icon: 'error',
      title: 'La partida no cuadra',
      html : `Debe: <strong>${q(sumaDebe)}</strong> — Haber: <strong>${q(sumaHaber)}</strong><br>
              Diferencia: <strong style="color:var(--danger)">${q(Math.abs(sumaDebe-sumaHaber))}</strong>`
    });
    return;
  }

  // Confirmación
  const confirm = await Swal.fire({
    title: '¿Guardar partida?',
    html : `<strong>${concepto}</strong><br>${fecha}<br><br>
            <span class="tag tag-success">Debe: ${q(sumaDebe)}</span>
            <span class="tag tag-danger ms-2">Haber: ${q(sumaHaber)}</span>`,
    icon: 'question',
    showCancelButton  : true,
    confirmButtonText : '<i class="bi bi-save me-1"></i>Guardar',
    cancelButtonText  : 'Revisar',
    confirmButtonColor: '#1a3c5e',
  });
  if (!confirm.isConfirmed) return;

  // Guardar en MySQL
  const res = await apiPost('libro_diario.php', { fecha, descripcion: concepto, lineas });

  if (res?.ok) {
    Swal.fire({
      icon : 'success',
      title: `¡Partida P-${String(res.id_partida).padStart(2,'0')} guardada!`,
      html : `Se registró en el Libro Diario y Libro Mayor.<br>
              <small class="text-muted">Puedes verla en la sección Libro Diario</small>`,
      confirmButtonColor: '#1a3c5e',
    }).then(() => {
      limpiarFormularioPartida();
      cargarPartidasRecientes();
    });
  } else if (res?.mensaje) {
    Swal.fire({ icon:'error', title:'Error contable', text: res.mensaje });
  }
}

// ─────────────────────────────────────────────────────────
// LIMPIAR FORMULARIO
// ─────────────────────────────────────────────────────────
function limpiarFormularioPartida() {
  document.getElementById('np-concepto').value = '';
  document.getElementById('np-lineas').innerHTML = '';
  _lineaCounter = 0;
  agregarLineaPartida();
  agregarLineaPartida();
  recalcularCuadre();
  // Reset panel
  const panelEl = document.getElementById('np-cuadre-panel');
  if (panelEl) { panelEl.style.borderColor = 'var(--border)'; panelEl.style.background = '#f0f4f8'; }
}

// ─────────────────────────────────────────────────────────
// PARTIDAS RECIENTES (panel lateral)
// ─────────────────────────────────────────────────────────
async function cargarPartidasRecientes() {
  const partidas = await apiGet('libro_diario.php');
  const contenedor = document.getElementById('np-partidas-recientes');
  if (!contenedor || !partidas) return;

  const ultimas = partidas.slice(-5).reverse();

  if (!ultimas.length) {
    contenedor.innerHTML = '<div class="text-muted text-center py-3 px-3">No hay partidas aún.</div>';
    return;
  }

  contenedor.innerHTML = ultimas.map(p => `
    <div class="px-3 py-2" style="border-bottom:1px solid var(--border)">
      <div class="d-flex justify-content-between align-items-center">
        <span class="tag tag-primary">P-${String(p.id_partida).padStart(2,'0')}</span>
        <span style="font-size:11px;color:var(--text-muted)">${p.fecha}</span>
      </div>
      <div class="mt-1" style="font-size:12px;color:var(--text-muted);
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escHtml(p.descripcion)}">
        ${escHtml(p.descripcion)}
      </div>
      <div class="d-flex gap-3 mt-1">
        <span style="font-size:11px" class="amount-debe">D: ${q(p.total_debe)}</span>
        <span style="font-size:11px" class="amount-haber">H: ${q(p.total_haber)}</span>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  PÁGINA NUEVA PARTIDA
// ═══════════════════════════════════════════════════════════

let _npCuentas = [];   // caché de cuentas contables

async function cargarNuevaPartida() {
  // Siempre recargar cuentas (evita duplicados por caché vieja)
  const data = await apiGet('cuentas.php');
  if (data) _npCuentas = data;

  // ── Fecha bloqueada al período seleccionado ──────────────
  const { mes, anio } = getPeriodo();
  const fechaInput    = document.getElementById('np-fecha');
  if (fechaInput) {
    // Calcular primer y último día del mes seleccionado
    const mm    = String(mes).padStart(2, '0');
    const ultimo = new Date(anio, mes, 0).getDate(); // último día del mes
    const minF  = `${anio}-${mm}-01`;
    const maxF  = `${anio}-${mm}-${String(ultimo).padStart(2,'0')}`;
    fechaInput.min   = minF;
    fechaInput.max   = maxF;
    // Si la fecha actual no está en el rango, resetear al día 1
    if (!fechaInput.value || fechaInput.value < minF || fechaInput.value > maxF) {
      fechaInput.value = minF;
    }
  }

  // ── Tabla de referencia de cuentas (sin duplicados) ──────
  const lista = document.getElementById('np-cuentas-lista');
  if (lista && _npCuentas.length) {
    lista.innerHTML = _npCuentas.map(c => `
      <tr>
        <td class="amount" style="font-size:11px">${c.codigo}</td>
        <td>${escHtml(c.nombre_cuenta)}</td>
        <td><span class="${tipoTag(c.tipo)}" style="font-size:10px">${c.tipo}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger px-1 py-0"
            style="font-size:10px;line-height:1.4"
            onclick="eliminarCuenta(${c.id_cuenta},'${escHtml(c.nombre_cuenta)}')"
            title="Eliminar cuenta">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`).join('');
  }

  // ── Iniciar con 2 líneas vacías si el tbody está vacío ───
  const tbody = document.getElementById('np-lineas');
  if (tbody && tbody.children.length === 0) {
    npAgregarLinea();
    npAgregarLinea();
  } else if (tbody) {
    // Refrescar los selects de las filas existentes con las cuentas actualizadas
    tbody.querySelectorAll('.np-cuenta').forEach(sel => {
      const valActual = sel.value;
      sel.innerHTML = `<option value="">— Selecciona una cuenta —</option>` +
        _npCuentas.map(c => `<option value="${c.id_cuenta}" ${c.id_cuenta == valActual ? 'selected' : ''}>${c.codigo} — ${c.nombre_cuenta}</option>`).join('');
    });
  }

  npCargarUltimas();
}

async function eliminarCuenta(id, nombre) {
  const confirm = await Swal.fire({
    title: '¿Eliminar cuenta?',
    html: `<b>${nombre}</b><br><small class="text-muted">Solo se puede eliminar si no tiene movimientos registrados.</small>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b',
  });
  if (!confirm.isConfirmed) return;

  const res = await apiDelete('cuentas.php', id);
  if (res?.ok) {
    Swal.fire({ icon:'success', title:'Cuenta eliminada', timer:1400, showConfirmButton:false });
    _npCuentas = [];
    cargarNuevaPartida();
  } else {
    Swal.fire({ icon:'error', title:'No se pudo eliminar', text: res?.mensaje || 'La cuenta tiene movimientos.' });
  }
}

// ── Modal nueva cuenta contable ──────────────────────────
async function abrirModalNuevaCuenta() {
  const { value: form } = await Swal.fire({
    title: '<i class="bi bi-plus-circle"></i> Nueva Cuenta Contable',
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="row g-2 mb-2">
          <div class="col-4">
            <label class="form-label fw-bold">Código <span class="text-danger">*</span></label>
            <input id="cta-codigo" class="form-control" placeholder="Ej: 1105">
          </div>
          <div class="col-8">
            <label class="form-label fw-bold">Nombre <span class="text-danger">*</span></label>
            <input id="cta-nombre" class="form-control" placeholder="Ej: Caja Chica">
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Tipo <span class="text-danger">*</span></label>
          <select id="cta-tipo" class="form-select">
            <option value="">— Selecciona el tipo —</option>
            <option value="ACTIVO">ACTIVO</option>
            <option value="PASIVO">PASIVO</option>
            <option value="CAPITAL">CAPITAL</option>
            <option value="INGRESO">INGRESO</option>
            <option value="GASTO">GASTO</option>
          </select>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Crear Cuenta',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1a3c5e',
    preConfirm: () => {
      const codigo = document.getElementById('cta-codigo').value.trim();
      const nombre = document.getElementById('cta-nombre').value.trim();
      const tipo   = document.getElementById('cta-tipo').value;
      if (!codigo || !nombre || !tipo) {
        Swal.showValidationMessage('Todos los campos son obligatorios.');
        return false;
      }
      if (!/^\d+$/.test(codigo)) {
        Swal.showValidationMessage('El código debe ser numérico. Ej: 1105');
        return false;
      }
      return { codigo, nombre_cuenta: nombre, tipo };
    }
  });

  if (form) {
    const res = await apiPost('cuentas.php', form);
    if (res?.ok) {
      Swal.fire({ icon:'success', title:'Cuenta creada', text:`${form.codigo} — ${form.nombre_cuenta}`, timer:1800, showConfirmButton:false });
      // Forzar recarga de cuentas
      _npCuentas = [];
      cargarNuevaPartida();
    } else {
      Swal.fire({ icon:'error', title:'Error', text: res?.mensaje || 'No se pudo crear la cuenta.' });
    }
  }
}

// ── Agregar una fila de línea contable ───────────────────
function npAgregarLinea() {
  const tbody  = document.getElementById('np-lineas');
  const idx    = Date.now(); // id único para la fila

  const opts = _npCuentas.map(c =>
    `<option value="${c.id_cuenta}">${c.codigo} — ${c.nombre_cuenta}</option>`
  ).join('');

  const tr = document.createElement('tr');
  tr.id = `np-fila-${idx}`;
  tr.innerHTML = `
    <td style="padding:6px 8px">
      <select class="form-select form-select-sm np-cuenta" onchange="npActualizarTotales()">
        <option value="">— Selecciona una cuenta —</option>
        ${opts}
      </select>
    </td>
    <td style="padding:6px 8px">
      <input type="number" class="form-control form-control-sm text-end np-debe"
        placeholder="0.00" step="0.01" min="0"
        oninput="npMutualExcluir(this,'debe'); npActualizarTotales()">
    </td>
    <td style="padding:6px 8px">
      <input type="number" class="form-control form-control-sm text-end np-haber"
        placeholder="0.00" step="0.01" min="0"
        oninput="npMutualExcluir(this,'haber'); npActualizarTotales()">
    </td>
    <td style="padding:6px 8px" class="text-center">
      <button class="btn btn-sm btn-outline-danger px-2"
        onclick="npEliminarLinea('np-fila-${idx}')" title="Quitar línea">
        <i class="bi bi-x-lg"></i>
      </button>
    </td>`;
  tbody.appendChild(tr);
  npActualizarTotales();
}

// Si escriben en Debe, limpian Haber y viceversa
function npMutualExcluir(input, campo) {
  const tr = input.closest('tr');
  if (campo === 'debe'  && parseFloat(input.value) > 0) tr.querySelector('.np-haber').value = '';
  if (campo === 'haber' && parseFloat(input.value) > 0) tr.querySelector('.np-debe').value  = '';
}

function npEliminarLinea(id) {
  const fila = document.getElementById(id);
  if (fila) { fila.remove(); npActualizarTotales(); }
}

// ── Actualizar totales y panel de cuadre en tiempo real ──
function npActualizarTotales() {
  let sumDebe = 0, sumHaber = 0;

  document.querySelectorAll('#np-lineas tr').forEach(tr => {
    sumDebe  += parseFloat(tr.querySelector('.np-debe')?.value)  || 0;
    sumHaber += parseFloat(tr.querySelector('.np-haber')?.value) || 0;
  });

  const diff = Math.abs(sumDebe - sumHaber);
  const cuadra = diff < 0.01 && (sumDebe > 0);

  // Totales en el tfoot
  document.getElementById('np-sum-debe').textContent  = q(sumDebe);
  document.getElementById('np-sum-haber').textContent = q(sumHaber);

  // Panel derecho
  document.getElementById('np-panel-debe').textContent  = q(sumDebe);
  document.getElementById('np-panel-haber').textContent = q(sumHaber);
  const elDiff = document.getElementById('np-panel-diff');
  elDiff.textContent = q(diff);
  elDiff.className   = 'fw-bold ' + (diff < 0.01 ? 'amount-pos' : 'amount-neg');

  // Estado
  const estado = document.getElementById('np-panel-estado');
  if (sumDebe === 0 && sumHaber === 0) {
    estado.innerHTML = `<span class="tag tag-warning" style="font-size:13px;padding:6px 14px">
      <i class="bi bi-hourglass-split me-1"></i> Esperando datos</span>`;
  } else if (cuadra) {
    estado.innerHTML = `<span class="tag tag-success" style="font-size:13px;padding:6px 14px">
      <i class="bi bi-check-circle-fill me-1"></i> ¡Partida cuadra!</span>`;
  } else {
    estado.innerHTML = `<span class="tag tag-danger" style="font-size:13px;padding:6px 14px">
      <i class="bi bi-x-circle-fill me-1"></i> No cuadra — diff: ${q(diff)}</span>`;
  }

  // Alerta en el formulario
  const alerta = document.getElementById('np-alerta');
  const icon   = document.getElementById('np-alerta-icon');
  const msg    = document.getElementById('np-alerta-msg');

  if (sumDebe === 0 && sumHaber === 0) {
    alerta.style.display = 'none';
  } else if (cuadra) {
    alerta.className     = 'alert alert-success mb-4 d-flex align-items-center gap-2';
    alerta.style.display = 'flex';
    icon.className       = 'bi bi-check-circle-fill fs-5';
    msg.textContent      = `Partida cuadra correctamente. Debe = Haber = ${q(sumDebe)}`;
  } else {
    alerta.className     = 'alert alert-danger mb-4 d-flex align-items-center gap-2';
    alerta.style.display = 'flex';
    icon.className       = 'bi bi-exclamation-triangle-fill fs-5';
    msg.textContent      = `La partida no cuadra. Debe: ${q(sumDebe)} | Haber: ${q(sumHaber)} | Diferencia: ${q(diff)}`;
  }
}

// ── Limpiar formulario ───────────────────────────────────
function limpiarFormPartida() {
  document.getElementById('np-concepto').value = '';
  document.getElementById('np-lineas').innerHTML = '';
  // Resetear fecha al inicio del período
  const { mes, anio } = getPeriodo();
  const fechaInput = document.getElementById('np-fecha');
  if (fechaInput) {
    const mm = String(mes).padStart(2,'0');
    fechaInput.value = `${anio}-${mm}-01`;
  }
  npAgregarLinea();
  npAgregarLinea();
  npActualizarTotales();
}

// ── Guardar partida ──────────────────────────────────────
async function npGuardar() {
  const fecha    = document.getElementById('np-fecha').value;
  const concepto = document.getElementById('np-concepto').value.trim();

  if (!fecha) {
    Swal.fire({ icon:'warning', title:'Falta la fecha', text:'Selecciona una fecha para la partida.' });
    return;
  }
  if (!concepto) {
    Swal.fire({ icon:'warning', title:'Falta el concepto', text:'Escribe una descripción para la partida.' });
    return;
  }

  // Recoger líneas
  const lineas = [];
  let valido = true;

  document.querySelectorAll('#np-lineas tr').forEach(tr => {
    const id_cuenta = parseInt(tr.querySelector('.np-cuenta')?.value) || 0;
    const debe      = parseFloat(tr.querySelector('.np-debe')?.value)  || 0;
    const haber     = parseFloat(tr.querySelector('.np-haber')?.value) || 0;
    if (id_cuenta && (debe > 0 || haber > 0)) {
      lineas.push({ id_cuenta, debe, haber });
    }
  });

  if (lineas.length < 2) {
    Swal.fire({ icon:'warning', title:'Líneas insuficientes', text:'Una partida necesita al menos 2 líneas con cuenta y monto.' });
    return;
  }

  const sumD = lineas.reduce((s,l) => s + l.debe,  0);
  const sumH = lineas.reduce((s,l) => s + l.haber, 0);

  if (Math.abs(sumD - sumH) > 0.01) {
    Swal.fire({
      icon : 'error',
      title: 'La partida no cuadra',
      html : `<b>Debe:</b> ${q(sumD)}<br><b>Haber:</b> ${q(sumH)}<br><b>Diferencia:</b> ${q(Math.abs(sumD-sumH))}`
    });
    return;
  }

  // Deshabilitar botón mientras guarda
  const btn = document.getElementById('np-btn-guardar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

  const res = await apiPost('libro_diario.php', { fecha, descripcion: concepto, lineas });

  btn.disabled = false;
  btn.innerHTML = '<i class="bi bi-save me-2"></i> Guardar Partida';

  if (res?.ok) {
    await Swal.fire({
      icon              : 'success',
      title             : `✅ Partida P-${String(res.id_partida).padStart(2,'0')} guardada`,
      html              : `<b>${concepto}</b><br>Debe = Haber = ${q(sumD)}`,
      confirmButtonText : 'Ver Libro Diario',
      showCancelButton  : true,
      cancelButtonText  : 'Nueva partida',
      confirmButtonColor: '#1a3c5e',
    }).then(r => {
      if (r.isConfirmed) {
        showPage('diario', document.querySelector('[onclick*="\'diario\'"]'));
      } else {
        limpiarFormPartida();
        npCargarUltimas();
      }
    });
  } else {
    Swal.fire({ icon:'error', title:'Error al guardar', text: res?.mensaje || 'Intenta de nuevo.' });
  }
}

// ── Últimas partidas (panel derecho) ─────────────────────
async function npCargarUltimas() {
  const partidas = await apiGet('libro_diario.php');
  const el = document.getElementById('np-ultimas');
  if (!el) return;

  if (!partidas || !partidas.length) {
    el.innerHTML = '<p class="text-muted text-center py-3" style="font-size:12px">No hay partidas aún.</p>';
    return;
  }

  const ultimas = partidas.slice(-5).reverse();
  el.innerHTML = ultimas.map(p => `
    <div class="d-flex justify-content-between align-items-start px-3 py-2"
         style="border-bottom:1px solid var(--border)">
      <div>
        <span class="tag tag-primary me-1" style="font-size:10px">
          P-${String(p.id_partida).padStart(2,'0')}
        </span>
        <span style="font-size:12px">${escHtml(p.descripcion)}</span>
      </div>
      <span class="amount-pos" style="font-size:12px;white-space:nowrap;margin-left:8px">
        ${q(p.total_debe)}
      </span>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
//  MODO NOCTURNO
// ═══════════════════════════════════════════════════════════
function toggleNocturno() {
  const body    = document.body;
  const btn     = document.getElementById('btn-nocturno');
  const esNoche = body.classList.toggle('dark-mode');
  localStorage.setItem('erp_dark', esNoche ? '1' : '0');
  if (btn) {
    btn.querySelector('i').className = esNoche
      ? 'bi bi-sun fs-5'
      : 'bi bi-moon fs-5';
    btn.querySelector('i').style.color = esNoche ? '#f0943e' : 'var(--primary)';
  }
}

function aplicarModoGuardado() {
  if (localStorage.getItem('erp_dark') === '1') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('btn-nocturno');
    if (btn) {
      btn.querySelector('i').className = 'bi bi-sun fs-5';
      btn.querySelector('i').style.color = '#f0943e';
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  DESCARGAR PDF
// ═══════════════════════════════════════════════════════════
async function descargarPDF() {
  const paginaActiva = document.querySelector('.page.active');
  if (!paginaActiva) return;

  const id     = paginaActiva.id.replace('page-', '');
  const titulo = titles[id] || 'Reporte';
  const periodo = getPeriodoLabel();

  Swal.fire({
    title: 'Generando PDF...',
    text: `${titulo} · ${periodo}`,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const canvas = await html2canvas(paginaActiva, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: document.body.classList.contains('dark-mode') ? '#0f172a' : '#f0f4f8',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const pdf    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW   = pdf.internal.pageSize.getWidth();
    const pdfH   = pdf.internal.pageSize.getHeight();
    const imgW   = canvas.width;
    const imgH   = canvas.height;
    const ratio  = pdfW / imgW;
    const totalH = imgH * ratio;
    let posY     = 0;

    // Encabezado en cada página
    const addHeader = (pageNum) => {
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Dulces y Delicias del Valle, S.A.  ·  ${titulo}  ·  ${periodo}`, 10, 8);
      pdf.text(`Pág. ${pageNum}`, pdfW - 20, 8);
      pdf.setDrawColor(200);
      pdf.line(10, 10, pdfW - 10, 10);
    };

    let page = 1;
    addHeader(page);

    while (posY < totalH) {
      const srcY    = posY / ratio;
      const sliceH  = Math.min(pdfH - 15, totalH - posY);
      const srcH    = sliceH / ratio;

      const slice   = document.createElement('canvas');
      slice.width   = imgW;
      slice.height  = srcH;
      slice.getContext('2d').drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

      const imgData = slice.toDataURL('image/jpeg', 0.9);
      pdf.addImage(imgData, 'JPEG', 0, 12, pdfW, sliceH);

      posY += sliceH;
      if (posY < totalH) {
        pdf.addPage();
        page++;
        addHeader(page);
      }
    }

    const filename = `${titulo.replace(/\s+/g,'_')}_${periodo.replace(/\s+/g,'_')}.pdf`;
    pdf.save(filename);
    Swal.close();

  } catch (err) {
    console.error(err);
    Swal.fire({ icon: 'error', title: 'Error al generar PDF', text: String(err) });
  }
}

// ═══════════════════════════════════════════════════════════
//  USUARIOS
// ═══════════════════════════════════════════════════════════
async function cargarUsuarios() {
  // Verificar permisos
  const sesion = getSesion();
  const rolesPermitidos = ['Gerente General', 'Contador'];
  if (!rolesPermitidos.includes(sesion?.rol)) {
    document.getElementById('usuarios-body').innerHTML = `
      <tr><td colspan="5" class="text-center py-4 text-muted">
        <i class="bi bi-lock fs-3 d-block mb-2"></i>
        No tienes permisos para ver esta sección.
      </td></tr>`;
    return;
  }

  const usuarios = await apiGet('usuarios.php');
  if (!usuarios) return;

  const tbody = document.getElementById('usuarios-body');
  const colores = ['#1a3c5e','#2980b9','#2d9e6b','#7f8c8d','#8e44ad','#e87c34'];

  tbody.innerHTML = usuarios.map((u, i) => {
    const iniciales = u.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
    const sesionActual = getSesion();
    const esSelf = sesionActual?.id == u.id_usuario;
    return `
      <tr>
        <td class="text-center">${i+1}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <div class="emp-avatar" style="background:${colores[i % colores.length]}">${iniciales}</div>
            <span class="fw-600">${escHtml(u.nombre)}</span>
            ${esSelf ? '<span class="tag tag-success ms-1" style="font-size:10px">Tú</span>' : ''}
          </div>
        </td>
        <td><code>${escHtml(u.usuario)}</code></td>
        <td><span class="tag ${u.rol==='Gerente General'?'tag-accent':u.rol==='Contador'?'tag-info':'tag-primary'}">${escHtml(u.rol)}</span></td>
        <td class="text-center">
          ${!esSelf ? `
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id_usuario},'${escHtml(u.nombre)}')" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>` : '<span class="text-muted" style="font-size:12px">—</span>'}
        </td>
      </tr>`;
  }).join('');
}

async function abrirModalUsuario() {
  const sesion = getSesion();
  const rolesPermitidos = ['Gerente General', 'Contador'];
  if (!rolesPermitidos.includes(sesion?.rol)) {
    Swal.fire({ icon:'warning', title:'Sin permisos', text:'Solo Contador o Gerente pueden crear usuarios.' });
    return;
  }

  const { value: form } = await Swal.fire({
    title: '<i class="bi bi-person-plus"></i> Nuevo Usuario',
    html: `
      <div style="text-align:left;font-size:14px">
        <div class="mb-2">
          <label class="form-label fw-bold">Nombre completo</label>
          <input id="usr-nombre" class="form-control" placeholder="Ej: María García López">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Nombre de usuario</label>
          <input id="usr-usuario" class="form-control" placeholder="Ej: mgarcia">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Contraseña</label>
          <input id="usr-pass" type="password" class="form-control" placeholder="Mínimo 6 caracteres">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Rol</label>
          <select id="usr-rol" class="form-select">
            <option value="">— Selecciona un rol —</option>
            <option value="Gerente General">Gerente General</option>
            <option value="Contador">Contador</option>
            <option value="Vendedor / Asesor">Vendedor / Asesor</option>
            <option value="Bodeguero">Bodeguero</option>
            <option value="Piloto / Repartidor">Piloto / Repartidor</option>
          </select>
        </div>
      </div>`,
    showCancelButton: true,
    confirmButtonText: 'Crear usuario',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#1a3c5e',
    preConfirm: () => {
      const nombre   = document.getElementById('usr-nombre').value.trim();
      const usuario  = document.getElementById('usr-usuario').value.trim();
      const password = document.getElementById('usr-pass').value;
      const rol      = document.getElementById('usr-rol').value;
      if (!nombre || !usuario || !password || !rol) {
        Swal.showValidationMessage('Todos los campos son obligatorios.');
        return false;
      }
      if (password.length < 6) {
        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres.');
        return false;
      }
      return { nombre, usuario, password, rol };
    }
  });

  if (form) {
    const res = await apiPost('usuarios.php', form);
    if (res?.ok) {
      Swal.fire({ icon:'success', title:'Usuario creado', timer:1500, showConfirmButton:false });
      cargarUsuarios();
    } else {
      Swal.fire({ icon:'error', title:'Error', text: res?.mensaje || 'No se pudo crear el usuario.' });
    }
  }
}

async function eliminarUsuario(id, nombre) {
  const confirm = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: nombre,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b',
  });
  if (!confirm.isConfirmed) return;
  const res = await apiDelete('usuarios.php', id);
  if (res?.ok) {
    Swal.fire({ icon:'success', title:'Usuario eliminado', timer:1400, showConfirmButton:false });
    cargarUsuarios();
  }
}

// ═══════════════════════════════════════════════════════════
//  ESTADO DE RESULTADOS — NIC 1 Dinámico
// ═══════════════════════════════════════════════════════════
async function cargarEstadoResultados() {
  document.querySelectorAll('.periodo-label').forEach(el => el.textContent = getPeriodoLabel());
  const data = await apiGet(`estados_financieros.php?tipo=resultados&${getPeriodoStr()}`);
  if (!data) return;

  const el = document.getElementById('er-contenido');
  if (!el) return;

  const fila = (label, monto, clase = '', indent = false) => `
    <div class="ef-row ${indent ? 'indent' : ''}">
      <span>${label}</span>
      <span class="ef-amount ${clase}">${monto < 0 ? '(' : ''}${q(Math.abs(monto))}${monto < 0 ? ')' : ''}</span>
    </div>`;

  const seccion = (label) => `<div class="ef-row section-header">${label}</div>`;
  const subtotal = (label, monto, clase = '') => `
    <div class="ef-row subtotal">
      <span>${label}</span>
      <span class="ef-amount ${clase}">${monto < 0 ? '(' : ''}${q(Math.abs(monto))}${monto < 0 ? ')' : ''}</span>
    </div>`;

  let html = '';

  // ── Ingresos ──
  html += seccion('INGRESOS DE ACTIVIDADES ORDINARIAS (NIC 18 / NIIF 15)');
  data.ingresos.forEach(c => { html += fila(c.nombre_cuenta, c.saldo, 'amount-pos', true); });
  html += subtotal('Total Ingresos', data.total_ingresos, 'amount-pos');

  // ── Costo ──
  html += seccion('COSTO DE VENTAS (NIC 2)');
  html += fila('Costo de Mercadería Vendida', -data.costo_ventas, 'amount-neg', true);
  html += subtotal(`Utilidad Bruta (Margen ${data.margen_bruto}%)`,
    data.utilidad_bruta, data.utilidad_bruta >= 0 ? 'amount-pos' : 'amount-neg');

  // ── Gastos operativos ──
  html += seccion('GASTOS DE OPERACIÓN (NIC 19 / NIC 16)');
  data.gastos_oper.forEach(c => { html += fila(c.nombre_cuenta, -Math.abs(c.saldo), 'amount-neg', true); });

  if (data.depreciaciones.length) {
    html += `<div class="ef-row indent" style="color:var(--text-muted);font-size:12px;font-style:italic">
      — Depreciaciones y Amortizaciones (NIC 16) —</div>`;
    data.depreciaciones.forEach(c => { html += fila(c.nombre_cuenta, -Math.abs(c.saldo), 'amount-neg', true); });
  }

  html += subtotal('Total Gastos de Operación', -data.total_gastos_oper - data.total_dep, 'amount-neg');
  html += subtotal(`Resultado de Operación (Margen ${data.margen_oper}%)`,
    data.utilidad_oper, data.utilidad_oper >= 0 ? 'amount-pos' : 'amount-neg');

  // ── Impuestos ──
  if (data.iva > 0) {
    html += seccion('IMPUESTOS (NIC 12)');
    html += fila('IVA — Pequeño Contribuyente 5% (Decreto 27-92)', -data.iva, 'amount-neg', true);
  }

  // ── Resultado final ──
  const esGanancia = data.utilidad_neta >= 0;
  html += `<div class="ef-row total-final">
    <span>${esGanancia ? '✅ GANANCIA NETA DEL PERÍODO' : '⚠️ PÉRDIDA NETA DEL PERÍODO'}</span>
    <span>${data.utilidad_neta < 0 ? '(' : ''}${q(Math.abs(data.utilidad_neta))}${data.utilidad_neta < 0 ? ')' : ''}</span>
  </div>`;

  if (!esGanancia) {
    html += `<div class="alert alert-warning d-flex gap-2 m-3" style="font-size:12.5px">
      <i class="bi bi-exclamation-triangle-fill mt-1"></i>
      <div>Pérdida normal en etapa inicial. Punto de equilibrio estimado: 
      <strong>${q(data.total_gastos_oper + data.total_dep + data.costo_ventas + data.iva)}</strong> en ventas mensuales.</div>
    </div>`;
  }

  el.innerHTML = html;

  // Ratios
  const ratiosEl = document.getElementById('er-ratios-body');
  if (ratiosEl) {
    ratiosEl.innerHTML = `
      <table class="table table-sm mb-0" style="font-size:13px">
        <tbody>
          <tr><td class="text-muted">Margen Bruto (NIC 1)</td>
              <td class="text-end fw-bold ${data.margen_bruto>=0?'amount-pos':'amount-neg'}">${data.margen_bruto}%</td></tr>
          <tr><td class="text-muted">Margen Operativo</td>
              <td class="text-end fw-bold ${data.margen_oper>=0?'amount-pos':'amount-neg'}">${data.margen_oper}%</td></tr>
          <tr><td class="text-muted">Margen Neto</td>
              <td class="text-end fw-bold ${data.margen_neto>=0?'amount-pos':'amount-neg'}">${data.margen_neto}%</td></tr>
          <tr><td class="text-muted">Total Ingresos</td>
              <td class="text-end amount-pos">${q(data.total_ingresos)}</td></tr>
          <tr><td class="text-muted">Total Gastos</td>
              <td class="text-end amount-neg">${q(data.total_gastos_oper + data.total_dep + data.costo_ventas)}</td></tr>
          <tr><td class="text-muted">Resultado</td>
              <td class="text-end fw-bold ${data.utilidad_neta>=0?'amount-pos':'amount-neg'}">${q(data.utilidad_neta)}</td></tr>
        </tbody>
      </table>`;
  }
}

// ═══════════════════════════════════════════════════════════
//  BALANCE GENERAL — NIC 1 Corriente / No Corriente
// ═══════════════════════════════════════════════════════════
async function cargarBalanceGeneral() {
  document.querySelectorAll('.periodo-label').forEach(el => el.textContent = getPeriodoLabel());
  const data = await apiGet(`estados_financieros.php?tipo=balance&${getPeriodoStr()}`);
  if (!data) return;

  const elA = document.getElementById('bg-activos');
  const elP = document.getElementById('bg-pasivo');
  if (!elA || !elP) return;

  const fila = (label, monto, clase = '', indent = false, negativo = false) => `
    <div class="ef-row ${indent ? 'indent' : ''}">
      <span>${label}</span>
      <span class="ef-amount ${clase}">${negativo||monto<0?'(':''}${q(Math.abs(monto))}${negativo||monto<0?')':''}</span>
    </div>`;
  const seccion = (label) => `<div class="ef-row section-header">${label}</div>`;
  const subtotal = (label, monto, clase = '') => `
    <div class="ef-row subtotal"><span>${label}</span>
      <span class="ef-amount ${clase}">${q(Math.abs(monto))}</span>
    </div>`;

  // ── ACTIVOS ──
  let htmlA = '';
  htmlA += seccion('ACTIVO CORRIENTE (NIC 1, párr. 66-68)');
  data.activos_corrientes.forEach(c => {
    htmlA += fila(c.nombre, c.saldo, c.saldo >= 0 ? 'amount-pos' : 'amount-neg', true);
  });
  htmlA += subtotal('Total Activo Corriente', data.total_ac, 'amount-pos');

  htmlA += seccion('ACTIVO NO CORRIENTE — Propiedad, Planta y Equipo (NIC 16)');
  data.activos_no_corrientes.forEach(c => {
    htmlA += fila(c.nombre, c.saldo, 'amount-pos', true);
  });
  data.dep_acumuladas.forEach(c => {
    htmlA += `<div class="ef-row indent" style="color:var(--danger);font-size:12px">
      <span>(−) ${c.nombre}</span>
      <span>(${q(Math.abs(c.saldo))})</span>
    </div>`;
  });
  htmlA += subtotal('Total Activo No Corriente Neto', data.total_anc, 'amount-pos');
  htmlA += `<div class="ef-row total-final"><span>TOTAL ACTIVO</span><span>${q(data.total_activo)}</span></div>`;
  elA.innerHTML = htmlA;

  // ── PASIVO Y PATRIMONIO ──
  let htmlP = '';
  htmlP += seccion('PASIVO CORRIENTE (NIC 1, párr. 69-76)');
  data.pasivos_corrientes.forEach(c => {
    htmlP += fila(c.nombre, c.saldo, 'amount-neg', true);
  });
  htmlP += subtotal('Total Pasivo Corriente', data.total_pc, 'amount-neg');

  htmlP += seccion('PATRIMONIO (NIC 1, párr. 54)');
  data.capital_cuentas.forEach(c => {
    htmlP += fila(c.nombre, c.saldo, 'amount-pos', true);
  });
  const esGanancia = data.utilidad_neta >= 0;
  htmlP += `<div class="ef-row indent">
    <span>${esGanancia ? 'Ganancia' : 'Pérdida'} del Período</span>
    <span class="ef-amount ${esGanancia ? 'amount-pos' : 'amount-neg'}">
      ${data.utilidad_neta < 0 ? '(' : ''}${q(Math.abs(data.utilidad_neta))}${data.utilidad_neta < 0 ? ')' : ''}
    </span>
  </div>`;
  htmlP += subtotal('Total Patrimonio', data.total_patrimonio,
    data.total_patrimonio >= 0 ? 'amount-pos' : 'amount-neg');

  const cuadra = data.cuadra;
  htmlP += `<div class="ef-row total-final" style="${cuadra ? '' : 'background:var(--danger)'}">
    <span>TOTAL PASIVO + PATRIMONIO ${cuadra ? '✅' : '⚠️'}</span>
    <span>${q(data.total_pasivo_patrimonio)}</span>
  </div>`;

  if (!cuadra) {
    htmlP += `<div class="alert alert-danger m-3" style="font-size:12.5px">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>
      El balance no cuadra. Revisa que todas las partidas estén correctamente registradas.
    </div>`;
  }

  elP.innerHTML = htmlP;
}

// ─────────────────────────────────────────────────────────
// SESIÓN
// ─────────────────────────────────────────────────────────
function getSesion() {
  try { return JSON.parse(sessionStorage.getItem('erp_usuario')); } catch { return null; }
}

function cerrarSesion() {
  Swal.fire({
    title: '¿Cerrar sesión?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, salir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#c0392b',
  }).then(r => {
    if (r.isConfirmed) {
      sessionStorage.removeItem('erp_usuario');
      window.location.href = 'login.html';
    }
  });
}

function cargarDatosSesion() {
  const sesion = getSesion();
  if (!sesion) return;
  const iniciales = sesion.nombre.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase();
  const elAvatar = document.getElementById('usr-avatar');
  const elNombre = document.getElementById('usr-nombre');
  const elRol    = document.getElementById('usr-rol');
  if (elAvatar) elAvatar.textContent = iniciales;
  if (elNombre) elNombre.textContent = sesion.nombre;
  if (elRol)    elRol.textContent    = sesion.rol;
}

// ─────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────
$(document).ready(function () {

  aplicarModoGuardado();
  cargarDatosSesion();
  cargarDashboard();

  // Poner mes actual en el selector
  const hoy = new Date();
  const selMes  = document.getElementById('sel-mes');
  const selAnio = document.getElementById('sel-anio');
  if (selMes)  selMes.value  = hoy.getMonth() + 1;
  if (selAnio) selAnio.value = hoy.getFullYear();

  const nombre = getSesion()?.nombre?.split(' ')[0] || 'Usuario';
  Swal.fire({
    toast             : true,
    position          : 'bottom-end',
    icon              : 'success',
    title             : `Bienvenido, ${nombre}`,
    text              : 'ERP Contable · Dulces y Delicias del Valle',
    showConfirmButton : false,
    timer             : 3000
  });

});
