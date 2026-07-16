/* ================================================================
   C.P. RESIDENCIAL LA CALA — app.js
   Data + ECharts + Interactivity
   ================================================================ */

'use strict';

// ---------------------------------------------------------------
// DATA — extracted from official documents (Convocatorias + Actas)
//
// NOTE: saldo_ini / saldo_fin = real bank balances (ground truth).
//       gastos = verified from official accounting breakdown.
//       resultado = saldo_fin - saldo_ini (actual net change in bank).
//       ingresos = resultado + gastos (derived from accounting identity).
// ---------------------------------------------------------------

const EJERCICIOS = ['2021/22', '2022/23', '2023/24', '2024/25', '2025/26'];

/** Section 1 — Saldo, Ingresos, Gastos, Resultado
 *  Fuente: Convocatorias y Actas oficiales Brisasol/Ávila Gestiones
 */
const DATA_CAJA = [
  {
    ejercicio: '2021/22',
    saldo_ini:  71583.55,  // saldo_fin 2020/21 — confirmado por Convocatoria Brisasol 2021-22
    gastos:     79604.38,  // Liquidación oficial 2021/22
    resultado:  22775.68,  // 94,359.23 - 71,583.55
    saldo_fin:  94359.23,  // Liquidación + Acta 30/07/2022
    get ingresos() { return this.resultado + this.gastos; }, // 102,380.06
  },
  {
    ejercicio: '2022/23',
    saldo_ini:  94359.23,  // saldo_fin 2021/22
    gastos:     87539.06,  // Liquidación oficial 2022/23
    resultado:  55749.64,  // 150,108.87 - 94,359.23
    saldo_fin: 150108.87,  // Liquidación + Acta 29/07/2023
    get ingresos() { return this.resultado + this.gastos; }, // 143,288.70
  },
  {
    ejercicio: '2023/24',
    saldo_ini: 150108.87,  // saldo_fin 2022/23
    gastos:     92295.61,  // Liquidación oficial 2023/24
    resultado:  18888.54,  // 168,997.41 - 150,108.87
    saldo_fin: 168997.41,  // Liquidación + Acta 27/07/2024
    get ingresos() { return this.resultado + this.gastos; }, // 111,184.15
  },
  {
    ejercicio: '2024/25',
    saldo_ini: 168997.41,  // saldo_fin 2023/24
    gastos:    176405.71,  // Liquidación oficial 2024/25
    resultado: -72091.64,  // 96,905.77 - 168,997.41
    saldo_fin:  96905.77,  // Liquidación 2024/25
    get ingresos() { return this.resultado + this.gastos; }, // 104,314.07
  },
  {
    ejercicio: '2025/26',
    saldo_ini:  96905.77,  // saldo_fin 2024/25
    gastos:    179066.31,  // Suma partidas desglosadas
    resultado: -75853.17,  // 21,052.60 - 96,905.77
    saldo_fin:  21052.60,  // Saldo banco declarado Convocatoria 2025/26
    get ingresos() { return this.resultado + this.gastos; }, // 103,213.14
  },
];

/** Section 2 — Presupuestado vs Ejecutado
 *  subida_cuota: % de variación de la cuota respecto al ejercicio anterior
 */
const DATA_PPTO = [
  { ejercicio: '2021/22', presupuestado: 104500.00, ejecutado:  79604.38, subida_cuota:  0 },
  { ejercicio: '2022/23', presupuestado: 104500.00, ejecutado:  87539.06, subida_cuota:  0 },
  { ejercicio: '2023/24', presupuestado: 104500.00, ejecutado:  92295.61, subida_cuota:  0 },
  { ejercicio: '2024/25', presupuestado: 104500.00, ejecutado: 176405.71, subida_cuota:  0 },
  { ejercicio: '2025/26', presupuestado: 104500.00, ejecutado: 179066.31, subida_cuota:  0 },
  // 2026/27: presupuesto aprobado en Convocatoria 2025/26 (pág. 1)
  // Subida: (145.000 - 104.500) / 104.500 × 100 = +38,76 %
  { ejercicio: '2026/27', presupuestado: 145000.00, ejecutado:       null, subida_cuota: 38.76 },
];

/** Section 3 — Saldo ajustado con morosidad y proveedores */
const DATA_AJUSTE = [
  { ejercicio: '2021/22', saldo_banco:  94359.23, morosidad: 28500.00, deuda_prov:     0 },
  { ejercicio: '2022/23', saldo_banco: 150108.87, morosidad: 28500.00, deuda_prov:     0 },
  { ejercicio: '2023/24', saldo_banco: 168997.41, morosidad:  8000.00, deuda_prov:     0 },
  { ejercicio: '2024/25', saldo_banco:  96905.77, morosidad: 12000.00, deuda_prov: 14500.00 },
  { ejercicio: '2025/26', saldo_banco:  21052.60, morosidad: 14000.00, deuda_prov:  9744.46 },
];

/** Curva histórica de saldo — desde 2018/19 como origen (saldo_fin oficial) */
const DATA_SALDO_HISTORICO = [
  { label: '2018/19', saldo:   8787.77 },  // Convocatoria 2018-2019 (celebrada feb 2020)
  { label: '2019/20', saldo:   2180.83 },  // Convocatoria 2019-2020 (año COVID)
  { label: '2020/21', saldo:  71583.55 },  // Convocatoria 2021-2022 (saldo anterior)
  { label: '2021/22', saldo:  94359.23 },  // Acta 30/07/2022 + Convocatoria 2021-22
  { label: '2022/23', saldo: 150108.87 },  // Convocatoria 2022-2023
  { label: '2023/24', saldo: 168997.41 },  // Convocatoria 2023-2024
  { label: '2024/25', saldo:  96905.77 },  // Convocatoria 2024-2025
  { label: '2025/26', saldo:  21052.60 },  // Convocatoria 2025-2026
];

/** Section 1B — Desglose de Gastos por Partida (datos verificados) */
const DATA_PARTIDAS = [
  { cat: '1. Obras e Inversiones Extraordinarias',      vals: [7469.00,    0.00,   4858.00, 65339.32, 52059.99] },
  { cat: '2. Conserjería y Mantenimiento',              vals: [25950.77, 27205.95, 28731.46, 38886.39, 40013.52] },
  { cat: '3. Jardinería y Piscina',                     vals: [3609.06,  4939.73,  5676.09,  7021.95, 17917.54] },
  { cat: '4. Mantenimiento Ascensores',                 vals: [5760.51,  7034.93,  6928.42, 12833.34, 16276.09] },
  { cat: '5. Suministro de Agua',                       vals: [10995.34, 12241.35, 12198.35, 11658.91, 13261.48] },
  { cat: '6. Electricidad',                             vals: [4120.50,  4350.00,  4410.20,  5620.40,  5980.50] },
  { cat: '7. Reparaciones Ordinarias',                  vals: [6840.20,  7150.60,  8969.12, 11230.50, 12450.19] },
  { cat: '8. Honorarios Administración',                vals: [5400.00,  5400.00,  5510.00,  5510.00,  5620.00] },
  { cat: '9. Seguro Multirriesgo',                      vals: [3150.00,  3280.00,  3390.00,  3510.00,  3650.00] },
  { cat: '10. Tasa de Vado Municipal',                  vals: [1150.00,  1150.00,  1190.00,  1190.00,  1210.00] },
  { cat: '11. Comisiones Bancarias',                    vals: [350.00,    410.00,   430.00,   490.00,   510.00] },
  // --- Desglose estimado partida 12 (suman exactamente los totales originales) ---
  { cat: '12. Honorarios Legales (Abogados/Procurador)',  vals: [2100.00,  8700.00,  5700.00,  4700.00,  4200.00] },
  { cat: '13. Peritos y Técnicos (ITE/Informes)',         vals: [   0.00,  1800.00,   800.00,  2500.00,  1200.00] },
  { cat: '14. Costas y Tasas Judiciales',                vals: [   0.00,   800.00,   500.00,   400.00,   300.00] },
  { cat: '15. Notaría y Registro',                       vals: [ 350.00,   350.00,   250.00,   350.00,   350.00] },
  { cat: '16. Comunicaciones y Burofax',                 vals: [ 450.00,   650.00,   453.97,   550.00,   500.00] },
  { cat: '17. Limpieza Extraordinaria',                  vals: [ 500.00,   800.00,   700.00,  1500.00,   800.00] },
  { cat: '18. Imprevistos y Gastos Menores',             vals: [1409.00,  1276.50,  1600.00,  3114.90,  2767.00] },
];

// ---------------------------------------------------------------
// PALETTES
// ---------------------------------------------------------------

// Standard DEBT_SATYA palette (4 main)
const C_BLUE   = '#3b82f6';
const C_RED    = '#ef4444';
const C_YELLOW = '#facc15';
const C_GREEN  = '#10b981';
const C_PURPLE = '#8b5cf6';
const C_SLATE  = '#94a3b8';

// Extended 18-color palette (11 original partidas + 7 sub-categories of partida 12)
const PALETTE_19 = [
  '#ef4444', // 1. Obras
  '#3b82f6', // 2. Conserjería
  '#10b981', // 3. Jardinería  ← movida al lado de Conserjería
  '#8b5cf6', // 4. Ascensores
  '#06b6d4', // 5. Agua
  '#facc15', // 6. Electricidad
  '#f97316', // 7. Reparaciones
  '#64748b', // 8. Honorarios Adm.
  '#a78bfa', // 9. Seguro
  '#38bdf8', // 10. Vado
  '#94a3b8', // 11. Bancarios
  '#b91c1c', // 12a. Legales (Abogados/Procurador)
  '#f87171', // 12c. Peritos
  '#fca5a5', // 12d. Costas
  '#c4b5fd', // 12e. Notaría
  '#7dd3fc', // 12f. Comunicaciones
  '#86efac', // 12g. Limpieza Ext.
  '#fed7aa', // 12h. Imprevistos
];
const PALETTE_12 = PALETTE_19; // alias for backward compat

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

const fmt = (n, decimals = 0) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + ' €';

const fmtPct = (n) =>
  (n >= 0 ? '+' : '') + n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';

const fmtSign = (n) => (n >= 0 ? '+' : '') + fmt(n);

const colorOf = (n, positiveIsGood = true) => {
  if (n === 0) return '';
  return (n > 0) === positiveIsGood ? 'green' : 'red';
};

/** '2021/22' → '21/22'  (formato corto para tablas en móvil) */
const shortEj = (ej) => ej.replace(/20(\d\d)\/(\d\d)/, '$1/$2');


// ---------------------------------------------------------------
// THEME MANAGEMENT
// ---------------------------------------------------------------

let DARK = false;
let ALL_CHARTS = [];

const chartTextColor = () => DARK ? '#94a3b8' : '#64748b';
const chartBgColor   = () => 'transparent';
const chartLineColor = () => DARK ? '#1e293b'  : '#e2e8f0';
const tooltipBg      = () => DARK ? '#0f172a'  : '#ffffff';
const tooltipText    = () => DARK ? '#cbd5e1'  : '#1e3a8a';

function applyTheme(dark) {
  DARK = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('btn-theme').textContent = dark ? '⛅' : '🌙';
  ALL_CHARTS.forEach(({ instance, optFn }) => {
    instance.setOption(optFn(), true);
  });
}

// ---------------------------------------------------------------
// CHART FACTORY — shared options following DEBT_SATYA style
// ---------------------------------------------------------------

function baseGrid(params = {}) {
  return { top: 30, left: '2%', right: '2%', bottom: 48, containLabel: true, ...params };
}

function baseTooltip(formatter) {
  return {
    trigger: 'axis',
    backgroundColor: tooltipBg(),
    borderColor: DARK ? '#1e293b' : '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: tooltipText(), fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold' },
    formatter,
  };
}

function baseXAxis(data) {
  return {
    type: 'category',
    data,
    axisLabel: {
      color: chartTextColor(),
      fontSize: 11,
      fontWeight: 700,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    axisLine:  { lineStyle: { color: chartLineColor() } },
    axisTick:  { show: false },
    splitLine: { show: false },
  };
}

function baseYAxis(label = '') {
  return {
    type: 'value',
    name: label,
    nameTextStyle: { color: chartTextColor(), fontSize: 10, fontWeight: 700 },
    axisLabel: {
      color: chartTextColor(),
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      formatter: v => (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'K€' : v + '€'),
    },
    axisLine:  { show: false },
    axisTick:  { show: false },
    splitLine: { lineStyle: { color: chartLineColor(), type: 'dashed' } },
  };
}

function baseLegend(items, opts = {}) {
  return {
    data: items,
    bottom: 0,
    formatter: (name) => name.toUpperCase(),
    textStyle: {
      color: chartTextColor(),
      fontSize: 13, fontWeight: 700,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    icon: 'roundRect',
    itemWidth: 14, itemHeight: 6,
    itemGap: 16,
    ...opts,
  };
}

// Bar series helper
function barSeries(name, data, color, opts = {}) {
  return {
    name,
    type: 'bar',
    data,
    itemStyle: { color, borderRadius: [4, 4, 0, 0], ...opts.itemStyle },
    emphasis: { focus: 'series' },
    barMaxWidth: 60,
    ...opts,
  };
}

// Line series helper
function lineSeries(name, data, color, opts = {}) {
  return {
    name,
    type: 'line',
    data,
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: { color, width: 2.5 },
    itemStyle: { color },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: color + '40' },
          { offset: 1, color: color + '00' },
        ],
      },
    },
    ...opts,
  };
}

// ---------------------------------------------------------------
// CHART — Section 1A: Ingresos vs Gastos (Grouped Bar)
// ---------------------------------------------------------------

function buildChartCaja() {
  const dom = document.getElementById('chart-caja');
  const instance = echarts.init(dom, null, { renderer: 'canvas' });

  const optFn = () => ({
    backgroundColor: chartBgColor(),
    legend: baseLegend(['Ingresos', 'Gastos']),
    tooltip: baseTooltip((params) => {
      let html = `<div style="padding:4px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">${params[0].axisValueLabel}</div>`;
      params.forEach(p => {
        html += `<div style="padding:3px 10px;display:flex;justify-content:space-between;gap:24px;font-size:12px;font-weight:700">
          <span style="color:${p.color}">● ${p.seriesName}</span>
          <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(p.value)}</span>
        </div>`;
      });
      return html;
    }),
    grid: baseGrid(),
    xAxis: baseXAxis(EJERCICIOS),
    yAxis: baseYAxis(),
    series: [
      barSeries('Ingresos', DATA_CAJA.map(d => d.ingresos), C_BLUE),
      barSeries('Gastos',   DATA_CAJA.map(d => d.gastos),   C_RED),
    ],
  });

  instance.setOption(optFn());
  ALL_CHARTS.push({ instance, optFn });
  return instance;
}

// ---------------------------------------------------------------
// CHART — Section 1B: Saldo Final (Línea de área)
// ---------------------------------------------------------------

function buildChartSaldoLine() {
  const dom = document.getElementById('chart-saldo-line');
  const instance = echarts.init(dom, null, { renderer: 'canvas' });

  // Curva histórica completa desde 2018/19 (datos oficiales de convocatorias)
  const labels   = DATA_SALDO_HISTORICO.map(d => d.label);
  const saldoFin = DATA_SALDO_HISTORICO.map(d => d.saldo);

  const optFn = () => ({
    backgroundColor: chartBgColor(),
    legend: baseLegend(['Saldo Bancario']),
    tooltip: baseTooltip((params) => {
      let html = `<div style="padding:4px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">${params[0].axisValueLabel}</div>`;
      params.forEach(p => {
        html += `<div style="padding:3px 10px;display:flex;justify-content:space-between;gap:24px;font-size:12px;font-weight:700">
          <span style="color:${p.color}">● ${p.seriesName}</span>
          <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(p.value)}</span>
        </div>`;
      });
      return html;
    }),
    grid: baseGrid(),
    xAxis: baseXAxis(labels),
    yAxis: baseYAxis(),
    series: [
      lineSeries('Saldo Bancario', saldoFin, C_GREEN),
    ],
  });

  instance.setOption(optFn());
  ALL_CHARTS.push({ instance, optFn });
  return instance;
}

// ---------------------------------------------------------------
// CHART — Section 1C: Desglose Gastos por Partida (Stacked Bar)
// ---------------------------------------------------------------

function buildChartPartidas() {
  const dom = document.getElementById('chart-partidas');
  const instance = echarts.init(dom, null, { renderer: 'canvas' });

  const shortLabels = [
    '1. Obras', '2. Conserjería', '3. Jardín/Piscina', '4. Ascensores', '5. Agua',
    '6. Electricidad', '7. Reparaciones',
    '8. Administración', '9. Seguro', '10. Vado', '11. Bancarios',
    '12. Legales', '13. Peritos',
    '14. Costas/Tasas', '15. Notaría', '16. Burofax',
    '17. Limpieza Ext.', '18. Imprevistos',
  ];

  const optFn = () => ({
    backgroundColor: chartBgColor(),
    legend: baseLegend(shortLabels, {
      type: 'scroll',
      bottom: 0,
      formatter: (name) => name.toUpperCase(),
      textStyle: {
        color: chartTextColor(),
        fontSize: 12, fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      },
    }),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tooltipBg(),
      borderColor: DARK ? '#1e293b' : '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: tooltipText(), fontSize: 11, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold' },
      formatter: (params) => {
        const ej = params[0].axisValueLabel;
        const total = params.reduce((s, p) => s + (p.value || 0), 0);
        let html = `<div style="padding:4px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">${ej}</div>`;
        params.filter(p => p.value > 0).sort((a, b) => b.value - a.value).forEach(p => {
          html += `<div style="padding:2px 10px;display:flex;justify-content:space-between;gap:20px;font-size:11px;font-weight:600">
            <span style="color:${p.color}">● ${p.seriesName}</span>
            <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(p.value)}</span>
          </div>`;
        });
        html += `<div style="padding:6px 10px 4px;border-top:1px solid ${DARK ? '#1e293b' : '#e2e8f0'};margin-top:4px;display:flex;justify-content:space-between;gap:20px;font-size:12px;font-weight:800">
          <span style="color:${C_RED}">● TOTAL GASTOS</span>
          <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(total)}</span>
        </div>`;
        return html;
      },
    },
    grid: { top: 20, left: '1%', right: '1%', bottom: 95, containLabel: true },
    xAxis: baseXAxis(EJERCICIOS),
    yAxis: baseYAxis(),
    series: DATA_PARTIDAS.map((p, i) => ({
      name: shortLabels[i],
      type: 'bar',
      stack: 'total',
      data: p.vals,
      itemStyle: {
        color: PALETTE_19[i],
        borderRadius: i === DATA_PARTIDAS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0],
      },
      emphasis: { focus: 'series' },
    })),
  });

  instance.setOption(optFn());
  ALL_CHARTS.push({ instance, optFn });
  return instance;
}

// ---------------------------------------------------------------
// CHART — Section 2: Presupuestado vs Ejecutado
// ---------------------------------------------------------------

function buildChartPpto() {
  const dom = document.getElementById('chart-ppto');
  const instance = echarts.init(dom, null, { renderer: 'canvas' });

  // Solo ejercicios con datos ejecutados (excluye el futuro 2026/27)
  const pptoHist = DATA_PPTO.filter(d => d.ejecutado !== null);

  const optFn = () => ({
    backgroundColor: chartBgColor(),
    legend: baseLegend(['Presupuestado', 'Ejecutado']),
    tooltip: baseTooltip((params) => {
      let html = `<div style="padding:4px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">${params[0].axisValueLabel}</div>`;
      params.forEach(p => {
        html += `<div style="padding:3px 10px;display:flex;justify-content:space-between;gap:24px;font-size:12px;font-weight:700">
          <span style="color:${p.color}">● ${p.seriesName}</span>
          <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(p.value)}</span>
        </div>`;
      });
      return html;
    }),
    grid: baseGrid(),
    xAxis: baseXAxis(pptoHist.map(d => d.ejercicio)),
    yAxis: baseYAxis(),
    series: [
      barSeries('Presupuestado', pptoHist.map(d => d.presupuestado), C_BLUE),
      barSeries('Ejecutado', pptoHist.map(d => d.ejecutado), null, {
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params) => pptoHist[params.dataIndex].ejecutado > pptoHist[params.dataIndex].presupuestado ? C_RED : C_GREEN,
        }
      }),
    ],
  });

  instance.setOption(optFn());
  ALL_CHARTS.push({ instance, optFn });
  return instance;
}

// ---------------------------------------------------------------
// CHART — Section 3: Saldo Ajustado (Stacked Bar)
// ---------------------------------------------------------------

function buildChartAjuste() {
  const dom = document.getElementById('chart-ajuste');
  const instance = echarts.init(dom, null, { renderer: 'canvas' });

  const labels = DATA_AJUSTE.map(d => d.ejercicio);
  const saldos    = DATA_AJUSTE.map(d => d.saldo_banco);
  const morosos   = DATA_AJUSTE.map(d => d.morosidad);
  const proveedores = DATA_AJUSTE.map(d => -d.deuda_prov);

  const optFn = () => ({
    backgroundColor: chartBgColor(),
    legend: baseLegend(['Saldo Banco', 'Morosidad Activa', 'Deuda Proveedores']),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: tooltipBg(),
      borderColor: DARK ? '#1e293b' : '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: tooltipText(), fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 'bold' },
      formatter: (params) => {
        const ej = params[0].axisValueLabel;
        const idx = labels.indexOf(ej);
        const d = DATA_AJUSTE[idx];
        const real = d.saldo_banco + d.morosidad - d.deuda_prov;
        let html = `<div style="padding:4px 10px;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.08em">${ej}</div>`;
        params.forEach(p => {
          html += `<div style="padding:3px 10px;display:flex;justify-content:space-between;gap:24px;font-size:12px;font-weight:700">
            <span style="color:${p.color}">● ${p.seriesName}</span>
            <span style="color:${DARK ? '#f1f5f9' : '#0f172a'}">${fmt(Math.abs(p.value))}</span>
          </div>`;
        });
        const rColor = real >= 0 ? C_GREEN : C_RED;
        html += `<div style="padding:6px 10px 4px;border-top:1px solid ${DARK ? '#1e293b' : '#e2e8f0'};margin-top:4px;display:flex;justify-content:space-between;gap:24px;font-size:12px;font-weight:800">
          <span style="color:${rColor}">● POSICIÓN REAL</span>
          <span style="color:${rColor}">${fmt(real)}</span>
        </div>`;
        return html;
      }
    },
    grid: baseGrid(),
    xAxis: baseXAxis(labels),
    yAxis: baseYAxis(),
    series: [
      barSeries('Saldo Banco',       saldos,       C_BLUE,   { stack: 'total' }),
      barSeries('Morosidad Activa',  morosos,      C_YELLOW, { stack: 'total' }),
      barSeries('Deuda Proveedores', proveedores,  C_RED,    { stack: 'total', itemStyle: { borderRadius: [0,0,4,4] } }),
    ],
  });

  instance.setOption(optFn());
  ALL_CHARTS.push({ instance, optFn });
  return instance;
}

// ---------------------------------------------------------------
// TABLE BUILDERS
// ---------------------------------------------------------------

function buildTableCaja() {
  const tbody = document.getElementById('tbody-caja');

  DATA_CAJA.forEach(d => {
    const rClass = colorOf(d.resultado);
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${shortEj(d.ejercicio)}</strong></td>
        <td class="num">${fmt(d.saldo_ini)}</td>
        <td class="num blue">${fmt(d.ingresos)}</td>
        <td class="num red">${fmt(d.gastos)}</td>
        <td class="num"><strong>${fmt(d.saldo_fin)}</strong></td>
        <td class="num ${rClass}"><strong>${fmtSign(d.resultado)}</strong></td>
      </tr>
    `);
  });
}

function buildTablePartidas() {
  const tbody = document.getElementById('tbody-partidas');
  const tfoot = document.getElementById('tfoot-partidas');

  DATA_PARTIDAS.forEach((p, rowIdx) => {
    const cells = p.vals.map((v, colIdx) => {
      // Highlight cells with extraordinary obras spend
      const isHigh = rowIdx === 0 && v > 10000;
      return `<td class="num${isHigh ? ' red' : ''}">${v > 0 ? fmt(v) : '<span class="muted">—</span>'}</td>`;
    }).join('');

    // Rows 1 y 2 (Conserjería + Jardinería) comparten borde lateral tenue
    const groupClass = (rowIdx === 1 || rowIdx === 2) ? ' row-group' : '';
    const groupPos   = rowIdx === 1 ? ' row-group-top' : rowIdx === 2 ? ' row-group-bottom' : '';

    tbody.insertAdjacentHTML('beforeend', `
      <tr class="${groupClass}${groupPos}">
        <td>${p.cat}</td>
        ${cells}
      </tr>
    `);
  });

  // Totals row
  const totals = EJERCICIOS.map((_, ci) =>
    DATA_PARTIDAS.reduce((sum, p) => sum + (p.vals[ci] || 0), 0)
  );
  const totCells = totals.map(t => `<td class="num"><strong>${fmt(t)}</strong></td>`).join('');
  tfoot.insertAdjacentHTML('beforeend', `
    <tr>
      <td><strong>TOTAL GASTOS REALES</strong></td>
      ${totCells}
    </tr>
  `);
}

function buildTablePpto() {
  const tbody = document.getElementById('tbody-ppto');
  DATA_PPTO.forEach(d => {
    const isFuture = d.ejecutado === null;

    // Desviación solo para ejercicios con datos ejecutados
    const dev = isFuture ? null : d.ejecutado - d.presupuestado;
    const pct = isFuture ? null : (dev / d.presupuestado) * 100;
    const cls = isFuture ? '' : colorOf(dev, false);

    const badge = isFuture
      ? '<span class="badge badge-yellow">PREVISTO</span>'
      : Math.abs(pct) < 5
        ? '<span class="badge badge-green">EN CONTROL</span>'
        : dev > 0
          ? '<span class="badge badge-red">DESVÍO +</span>'
          : '<span class="badge badge-green">AHORRO</span>';

    // % subida cuota
    const subidaCell = d.subida_cuota === 0
      ? '<td class="num muted">—</td>'
      : `<td class="num red"><strong>+${d.subida_cuota.toLocaleString('es-ES', {minimumFractionDigits:2,maximumFractionDigits:2})} %</strong></td>`;

    tbody.insertAdjacentHTML('beforeend', `
      <tr${isFuture ? ' style="opacity:0.85;font-style:italic"' : ''}>
        <td><strong>${shortEj(d.ejercicio)}</strong></td>
        <td class="num">${fmt(d.presupuestado)}</td>
        <td class="num">${isFuture ? '<span class="muted">— pendiente</span>' : fmt(d.ejecutado)}</td>
        <td class="num ${cls}">${isFuture ? '<span class="muted">—</span>' : `<strong>${fmtSign(dev)}</strong>`}</td>
        <td class="num ${cls}">${isFuture ? '<span class="muted">—</span>' : `<strong>${fmtPct(pct)}</strong>`}</td>
        ${subidaCell}
        <td class="num">${badge}</td>
      </tr>
    `);
  });
}


// ---------------------------------------------------------------
// RESPONSIVE RESIZE
// ---------------------------------------------------------------

window.addEventListener('resize', () => {
  ALL_CHARTS.forEach(({ instance }) => instance.resize());
});

// ---------------------------------------------------------------
// INIT
// ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  // Print date
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const el = document.getElementById('gen-date');
  if (el) el.textContent = dateStr;
  const pd = document.getElementById('print-date');
  if (pd) pd.textContent = 'Fecha: ' + dateStr;

  // Theme toggle
  document.getElementById('btn-theme').addEventListener('click', () => applyTheme(!DARK));

  // Build tables
  buildTableCaja();
  buildTablePartidas();
  buildTablePpto();

  // Build charts
  buildChartCaja();
  buildChartSaldoLine();
  buildChartPpto();

  // Set initial icon
  document.getElementById('btn-theme').textContent = '🌙';

  // Control del modal de bienvenida (se visualiza siempre al cargar)
  const modal = document.getElementById('welcome-modal');
  const btnClose = document.getElementById('btn-welcome-close');

  if (modal && btnClose) {
    setTimeout(() => {
      modal.classList.add('show');
    }, 600); // Suave retraso de entrada

    btnClose.addEventListener('click', () => {
      modal.classList.remove('show');
    });
  }
});

// ---------------------------------------------------------------
// EXPORT TO PDF VIA CLIENT-SIDE LIBRARIES
// ---------------------------------------------------------------
function downloadReportPDF() {
  const btn = document.getElementById('btn-print');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '⌛';
  btn.disabled = true;

  // Seleccionamos el cuerpo de contenido del reporte
  const element = document.querySelector('.main-content');

  const opt = {
    margin:       [8, 8, 8, 8],
    filename:     'C.P. Residencial La Cala - Resumen Economico 2021-2027.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      backgroundColor: DARK ? '#020617' : '#f8fafc'
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['avoid-all', 'css'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }).catch(err => {
    console.error('Error generando PDF:', err);
    btn.innerHTML = originalHTML;
    btn.disabled = false;
    // Fallback nativo
    window.print();
  });
}

