let sales = [];
let selectedPeriod = 'current';
let selectedChannel = 'all';
let selectedCompany = 'all';
const qs = (s) => document.querySelector(s);
const money = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const number = new Intl.NumberFormat('pt-BR');
const escapeHtml = (v='') => { const d=document.createElement('div'); d.textContent=String(v); return d.innerHTML; };
const localDate = (value) => new Date(`${value}T12:00:00`);
const iso = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

function bounds(period) {
  const today = new Date(); today.setHours(12,0,0,0);
  if (period === 'all') return {from:'0000-01-01',to:'9999-12-31',label:'Todas as vendas'};
  if (period === 'today') return {from:iso(today),to:iso(today),label:'Hoje'};
  if (period === 'yesterday') { const day=new Date(today); day.setDate(today.getDate()-1); return {from:iso(day),to:iso(day),label:'Ontem'}; }
  if (period === 'week') { const from=new Date(today), daysSinceMonday=(today.getDay()+6)%7; from.setDate(today.getDate()-daysSinceMonday); return {from:iso(from),to:iso(today),label:'Esta semana'}; }
  if (period === '7d') { const from=new Date(today); from.setDate(today.getDate()-6); return {from:iso(from),to:iso(today),label:'Últimos 7 dias'}; }
  const year=today.getFullYear(), month=today.getMonth();
  if (period === 'previous') { const from=new Date(year,month-1,1,12); const to=new Date(year,month,0,12); return {from:iso(from),to:iso(to),label:'Mês passado'}; }
  const from=new Date(year,month,1,12); return {from:iso(from),to:iso(today),label:'Mês atual'};
}

function currentRows() {
  const {from,to}=bounds(selectedPeriod), term=qs('#search').value.trim().toLowerCase();
  return sales.filter(s => s.date>=from && s.date<=to && (selectedChannel==='all' || String(s.ecommerce).toUpperCase().replace(/\s/g,'')===selectedChannel) && (selectedCompany==='all' || String(s.company).toUpperCase()===selectedCompany) && (!term || `${s.product} ${s.sku}`.toLowerCase().includes(term)));
}

function channelClass(value='') { const normalized=String(value).toUpperCase().replace(/\s/g,''); if(normalized.includes('TIKTOK')) return 'tiktok'; if(normalized.includes('SHOPEE')) return 'shopee'; if(normalized.includes('MERCADO')) return 'ml'; return 'other'; }

function aggregate(rows) {
  const map=new Map();
  rows.forEach(s=>{ const key=`${s.sku}|${s.product}`; const item=map.get(key)||{...s,quantity:0,total:0,returns:[],ecommerce:new Set(),log:new Set()}; item.quantity+=Number(s.quantity)||1; item.total+=Number(s.total)||0; if(Number.isFinite(Number(s.profitReturn))) item.returns.push(Number(s.profitReturn)); item.ecommerce.add(s.ecommerce||'—'); item.log.add(s.log||'—'); map.set(key,item); });
  return [...map.values()].map(x=>({...x,profitReturn:x.returns.length?x.returns.reduce((a,b)=>a+b,0)/x.returns.length:0,ecommerce:[...x.ecommerce].join(', '),log:[...x.log].join(', ')})).sort((a,b)=>b.quantity-a.quantity||b.total-a.total);
}

function render() {
  const rows=currentRows(), grouped=aggregate(rows), period=bounds(selectedPeriod);
  const revenue=rows.reduce((a,s)=>a+(Number(s.total)||0),0), validReturns=rows.map(s=>Number(s.profitReturn)).filter(Number.isFinite), avg=validReturns.length?validReturns.reduce((a,b)=>a+b,0)/validReturns.length:0;
  const channelLabel=selectedChannel==='all'?'Todos os canais':document.querySelector(`[data-channel="${selectedChannel}"]`).textContent;
  const companyLabel=selectedCompany==='all'?'Todas as empresas':selectedCompany;
  qs('#period-label').textContent=`${period.label} · ${companyLabel} · ${channelLabel} · ${rows.length ? `${localDate(rows.map(x=>x.date).sort()[0]).toLocaleDateString('pt-BR')} a ${localDate(rows.map(x=>x.date).sort().at(-1)).toLocaleDateString('pt-BR')}` : 'sem registros'}`;
  qs('#metric-sales').textContent=number.format(rows.reduce((a,s)=>a+(Number(s.quantity)||1),0)); qs('#metric-products').textContent=number.format(grouped.length); qs('#metric-revenue').textContent=money.format(revenue); qs('#metric-return').textContent=`${avg.toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
  qs('#sales-table').innerHTML=grouped.length?grouped.map(x=>`<tr><td class="product">${escapeHtml(x.product)}</td><td>${escapeHtml(x.sku)}</td><td>${number.format(x.quantity)}</td><td><span class="pill return">${x.profitReturn.toLocaleString('pt-BR',{maximumFractionDigits:1})}%</span></td><td><span class="channel-badge ${channelClass(x.ecommerce)}">${escapeHtml(x.ecommerce)}</span></td><td><span class="pill">${escapeHtml(x.log)}</span></td><td>${money.format(x.total)}</td></tr>`).join(''):'<tr><td class="empty" colspan="7">Nenhuma venda encontrada para este período e canal.</td></tr>';
}

async function loadData(){ try { const response=await fetch('data/vendas.json',{cache:'no-store'}); if(!response.ok) throw new Error(); const json=await response.json(); sales=Array.isArray(json.sales)?json.sales:[]; qs('#source-notice').classList.add('live'); qs('#source-notice').lastElementChild.textContent=`${number.format(sales.length)} vendas carregadas · atualizado em ${new Date(json.updatedAt).toLocaleString('pt-BR')}`; render(); } catch { qs('#source-notice').lastElementChild.textContent='Não foi possível carregar os dados. Tente atualizar novamente.'; } }
document.addEventListener('DOMContentLoaded',()=>{ document.querySelectorAll('[data-period]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-period]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');selectedPeriod=btn.dataset.period;render();})); document.querySelectorAll('[data-channel]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-channel]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');selectedChannel=btn.dataset.channel;render();})); document.querySelectorAll('[data-company]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-company]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');selectedCompany=btn.dataset.company;render();})); qs('#search').addEventListener('input',render); qs('#refresh').addEventListener('click',loadData); loadData(); });



