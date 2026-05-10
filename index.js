(function() {
  const HORARIOS = ['09:00','12:00','15:00','18:00'];
  const DIAS_ORDER = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];

  function getSlot(horario) {
    if (!horario) return null;
    const h = String(horario).trim();
    const idx = HORARIOS.findIndex(x => h.startsWith(x) || h === x);
    return idx >= 0 ? idx + 1 : null;
  }

  function getDiaSemana(dateVal) {
    try {
      const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      if (typeof dateVal === 'number') {
        const d = new Date((dateVal - 25569) * 86400000);
        return DIAS[d.getUTCDay()];
      }
      const d = new Date(String(dateVal).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
      return DIAS[d.getUTCDay()];
    } catch(e) { return null; }
  }

  function fmtNum(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(1)+'K';
    return Math.round(n).toString();
  }

  function fmtRpc(n) {
    if (!n || isNaN(n)) return '—';
    return 'R$' + Number(n).toFixed(2);
  }

  function getCtrColors(ctr) {
    if (ctr >= 0.12) return { badge: '#5DCAA5', text: '#04342C' };
    if (ctr >= 0.06) return { badge: '#EF9F27', text: '#412402' };
    return { badge: '#F09595', text: '#501313' };
  }

  function drawViz(data) {
    const style = `
      <style>
        *{box-sizing:border-box;margin:0;padding:0;font-family:'Google Sans',Arial,sans-serif}
        body{background:#111827;color:#e5e7eb;padding:12px;min-height:100vh}
        .slot-section{margin-bottom:14px}
        .slot-label{font-size:10px;font-weight:600;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;padding-left:2px}
        .cards-row{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
        .card{background:#1f2937;border-radius:8px;padding:8px;border:1px solid #374151}
        .card.empty{background:#161d29;border:1px dashed #374151;opacity:.4}
        .card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
        .card-dia{font-size:9px;color:#9ca3af;font-weight:600}
        .ctr-badge{font-size:9px;font-weight:700;padding:1px 5px;border-radius:20px}
        .card-name{font-size:10px;font-weight:600;color:#f9fafb;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .metrics{display:grid;grid-template-columns:1fr 1fr;gap:3px}
        .m-label{font-size:8px;color:#6b7280}
        .m-val{font-size:11px;font-weight:600;color:#f9fafb}
        .m-val.g{color:#5DCAA5}
        .m-val.a{color:#EF9F27}
        .m-val.r{color:#F09595}
        .empty-txt{font-size:9px;color:#4b5563;text-align:center;padding:12px 0}
        .no-data{text-align:center;padding:40px;color:#6b7280;font-size:13px}
      </style>
    `;

    const rows = data.tables.DEFAULT;
    if (!rows || rows.length === 0) {
      document.body.innerHTML = style + '<div class="no-data">Nenhum dado disponível.<br>Mapeie os campos: date, horario, campaing_name, delivered, open, click</div>';
      return;
    }

    // Agrupa por dia + slot
    const grouped = {};
    rows.forEach(row => {
      const dateVal   = row[0];
      const horario   = row[1];
      const campanha  = row[2];
      const delivered = Number(row[3]) || 0;
      const open      = Number(row[4]) || 0;
      const click     = Number(row[5]) || 0;
      const rpc       = row[6] !== undefined ? Number(row[6]) : null;

      const dia  = getDiaSemana(dateVal);
      const slot = getSlot(horario);
      if (!dia || !slot) return;

      const key = `${slot}||${dia}`;
      if (!grouped[key]) {
        grouped[key] = { dia, slot, horario: HORARIOS[slot-1], campanha, delivered: 0, open: 0, click: 0, rpcs: [] };
      }
      grouped[key].delivered += delivered;
      grouped[key].open      += open;
      grouped[key].click     += click;
      if (rpc !== null && !isNaN(rpc)) grouped[key].rpcs.push(rpc);
    });

    // Organiza por slot
    const bySlot = {};
    Object.values(grouped).forEach(item => {
      if (!bySlot[item.slot]) bySlot[item.slot] = {};
      bySlot[item.slot][item.dia] = item;
    });

    let html = style;

    [1,2,3,4].forEach(slot => {
      const horario = HORARIOS[slot-1];
      html += `<div class="slot-section">`;
      html += `<div class="slot-label">Slot ${slot} · ${horario}</div>`;
      html += `<div class="cards-row">`;

      DIAS_ORDER.forEach(dia => {
        const item = bySlot[slot]?.[dia];
        if (!item) {
          html += `<div class="card empty"><div class="empty-txt">${dia}<br>—</div></div>`;
          return;
        }
        const ctr = item.delivered > 0 ? item.click / item.delivered : 0;
        const ctrPct = (ctr * 100).toFixed(1) + '%';
        const colors = getCtrColors(ctr);
        const rpcVal = item.rpcs.length ? item.rpcs.reduce((a,b)=>a+b,0)/item.rpcs.length : null;
        const clickClass = ctr >= 0.12 ? 'g' : ctr >= 0.06 ? 'a' : 'r';

        html += `
          <div class="card">
            <div class="card-top">
              <span class="card-dia">${dia}</span>
              <span class="ctr-badge" style="background:${colors.badge};color:${colors.text}">${ctrPct}</span>
            </div>
            <div class="card-name" title="${item.campanha}">${item.campanha || '—'}</div>
            <div class="metrics">
              <div><div class="m-label">Volume</div><div class="m-val">${fmtNum(item.delivered)}</div></div>
              <div><div class="m-label">Opens</div><div class="m-val">${fmtNum(item.open)}</div></div>
              <div><div class="m-label">Clicks</div><div class="m-val ${clickClass}">${fmtNum(item.click)}</div></div>
              <div><div class="m-label">RPC</div><div class="m-val">${fmtRpc(rpcVal)}</div></div>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;
    });

    document.body.innerHTML = html;
  }

  function parseData(message) {
    const tables = message.tables || {};
    const defaultTable = tables.DEFAULT || tables[Object.keys(tables)[0]] || [];
    return { tables: { DEFAULT: defaultTable } };
  }

  // Listener do Looker Studio
  window.addEventListener('message', function(e) {
    try {
      const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (msg && msg.tables) {
        drawViz(parseData(msg));
      }
    } catch(err) {}
  });

  // Tela inicial enquanto aguarda dados
  document.addEventListener('DOMContentLoaded', function() {
    document.body.innerHTML = '<div style="background:#111827;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#6b7280;font-family:Google Sans,Arial,sans-serif;font-size:13px">Aguardando dados do Looker Studio...</div>';
  });
})();
