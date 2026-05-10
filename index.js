// Looker Studio Community Visualization
// Slot Card Grid — campos: date, horario, campaing_name, delivered, open, click, RPC

const dscc = require('@google/dscc');
const local = require('./local');

const HORARIOS = ['09:00','12:00','15:00','18:00'];
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_ORDER = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

function getSlot(horario) {
  const idx = HORARIOS.indexOf(horario);
  return idx >= 0 ? idx + 1 : null;
}

function getDiaSemana(dateStr) {
  const d = new Date(dateStr);
  return DIAS[d.getDay()];
}

function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 1000) return (n/1000).toFixed(1)+'K';
  return Math.round(n).toString();
}

function fmtRpc(n) {
  if (!n) return '—';
  return 'R$' + Number(n).toFixed(2);
}

function getCtrColor(ctr) {
  if (ctr >= 0.12) return { bg: '#E1F5EE', color: '#085041', badgeBg: '#9FE1CB' };
  if (ctr >= 0.08) return { bg: '#FAEEDA', color: '#633806', badgeBg: '#FAC775' };
  return { bg: '#FCEBEB', color: '#791F1F', badgeBg: '#F7C1C1' };
}

function drawViz(data) {
  const rows = data.tables.DEFAULT;
  
  // Agrupa por dia + horario + campanha
  const grouped = {};
  rows.forEach(row => {
    const dateVal = row.dimID_date?.[0] || row.date?.[0] || '';
    const horario = row.dimID_horario?.[0] || row.horario?.[0] || '';
    const campanha = row.dimID_campaing_name?.[0] || row.campaing_name?.[0] || '';
    const delivered = row.metricID_delivered?.[0] || row.delivered?.[0] || 0;
    const open = row.metricID_open?.[0] || row.open?.[0] || 0;
    const click = row.metricID_click?.[0] || row.click?.[0] || 0;
    const rpc = row.metricID_rpc?.[0] || row.rpc?.[0] || null;

    const dia = getDiaSemana(dateVal);
    const slot = getSlot(horario);
    if (!slot) return;

    const key = `${dia}||${slot}||${horario}`;
    if (!grouped[key]) {
      grouped[key] = { dia, slot, horario, campanha, delivered: 0, open: 0, click: 0, rpc: [] };
    }
    grouped[key].delivered += Number(delivered) || 0;
    grouped[key].open += Number(open) || 0;
    grouped[key].click += Number(click) || 0;
    if (rpc) grouped[key].rpc.push(Number(rpc));
  });

  // Agrupa por slot
  const bySlot = {};
  Object.values(grouped).forEach(item => {
    if (!bySlot[item.slot]) bySlot[item.slot] = {};
    bySlot[item.slot][item.dia] = item;
  });

  const slots = [1,2,3,4];
  const dias = DIAS_ORDER;

  let html = `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Google Sans', sans-serif; }
      body { background: #1a1a2e; color: #e0e0e0; padding: 12px; }
      .slot-section { margin-bottom: 16px; }
      .slot-label { font-size: 11px; font-weight: 600; color: #9E9E9E; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 8px; padding-left: 2px; }
      .cards-row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
      .card { background: #242438; border-radius: 10px; padding: 10px; border: 1px solid #333355; }
      .card.empty { background: #1e1e30; border: 1px dashed #333; opacity: 0.4; }
      .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
      .card-dia { font-size: 10px; color: #9E9E9E; font-weight: 600; }
      .ctr-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 20px; }
      .card-name { font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
      .metric-label { font-size: 9px; color: #9E9E9E; }
      .metric-val { font-size: 12px; font-weight: 600; color: #fff; }
      .metric-val.green { color: #5DCAA5; }
      .metric-val.amber { color: #EF9F27; }
      .metric-val.red { color: #F09595; }
      .empty-txt { font-size: 10px; color: #555; text-align: center; padding: 16px 0; }
    </style>
  `;

  slots.forEach(slot => {
    const horario = HORARIOS[slot - 1];
    html += `<div class="slot-section">`;
    html += `<div class="slot-label">Slot ${slot} · ${horario}</div>`;
    html += `<div class="cards-row">`;

    dias.forEach(dia => {
      const item = bySlot[slot]?.[dia];
      if (!item) {
        html += `<div class="card empty"><div class="empty-txt">${dia}<br>sem dados</div></div>`;
        return;
      }
      const ctr = item.delivered > 0 ? item.click / item.delivered : 0;
      const ctrPct = (ctr * 100).toFixed(1) + '%';
      const colors = getCtrColor(ctr);
      const rpcVal = item.rpc.length ? item.rpc.reduce((a,b)=>a+b,0)/item.rpc.length : null;
      
      const clickColor = ctr >= 0.12 ? 'green' : ctr >= 0.08 ? 'amber' : 'red';

      html += `
        <div class="card">
          <div class="card-top">
            <span class="card-dia">${dia}</span>
            <span class="ctr-badge" style="background:${colors.badgeBg};color:${colors.color}">${ctrPct}</span>
          </div>
          <div class="card-name" title="${item.campanha}">${item.campanha}</div>
          <div class="metrics">
            <div>
              <div class="metric-label">Volume</div>
              <div class="metric-val">${fmtNum(item.delivered)}</div>
            </div>
            <div>
              <div class="metric-label">Opens</div>
              <div class="metric-val">${fmtNum(item.open)}</div>
            </div>
            <div>
              <div class="metric-label">Clicks</div>
              <div class="metric-val ${clickColor}">${fmtNum(item.click)}</div>
            </div>
            <div>
              <div class="metric-label">RPC</div>
              <div class="metric-val">${fmtRpc(rpcVal)}</div>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  });

  document.body.innerHTML = html;
}

dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
