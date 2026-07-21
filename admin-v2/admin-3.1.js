/* Sharbo Auto DMS 3.1 — Dashboard, Reports, Backup & Global Search */
(() => {
  const $ = id => document.getElementById(id);
  const num = v => Number(v || 0);
  const fmt = v => new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD'}).format(num(v));
  const dateISO = v => v ? new Date(v).toISOString().slice(0,10) : '';
  const esc31 = v => String(v ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const download = (name, blob) => { const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); };
  const csv = rows => '\ufeff'+rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');
  const inRange = (value, from, to) => { const d=dateISO(value); return (!from||d>=from)&&(!to||d<=to); };

  let reportRows=[];
  let reportColumns=[];

  async function fetchAll(table, select='*'){
    const {data,error}=await sb.from(table).select(select);
    if(error) throw new Error(`${table}: ${error.message}`);
    return data||[];
  }

  async function loadBusinessSnapshot(){
    const [p,e]=await Promise.all([fetchAll('payments'),fetchAll('vehicle_expenses')]);
    const available=(vehicles||[]).filter(v=>!['Vendu','Archivé'].includes(v.status));
    const sold=(vehicles||[]).filter(v=>v.status==='Vendu');
    const sales=(contracts||[]).filter(c=>c.status!=='Annulé');
    const gross=sales.reduce((a,c)=>a+num(c.total_amount||c.sale_price),0);
    const paid=sales.reduce((a,c)=>a+num(c.deposit),0)+p.reduce((a,x)=>a+num(x.amount),0);
    const expenses=e.reduce((a,x)=>a+num(x.amount),0)+(vehicles||[]).reduce((a,v)=>a+num(v.purchase_price||v.cost)+num(v.preparation_cost)+num(v.transport_cost)+num(v.inspection_cost)+num(v.other_cost),0);
    const saleBeforeTax=sales.reduce((a,c)=>a+num(c.sale_price)+num(c.fees)-num(c.discount),0);
    return {p,e,available,sold,sales,gross,paid,balance:Math.max(0,gross-paid),expenses,profit:saleBeforeTax-expenses,inventoryValue:available.reduce((a,v)=>a+num(v.price),0)};
  }

  async function enhanceDashboard(){
    if(!$('page-dashboard')||!window.sb)return;
    try{
      const s=await loadBusinessSnapshot();
      let box=$('dms31Dashboard');
      if(!box){
        box=document.createElement('div'); box.id='dms31Dashboard';
        box.innerHTML=`<div class="stats dms31-stats">
          <article><span>Ventes totales</span><strong id="d31Sales">0 $</strong><small>Contrats non annulés</small></article>
          <article><span>Payé</span><strong id="d31Paid">0 $</strong><small>Dépôts + paiements</small></article>
          <article><span>Solde clients</span><strong id="d31Balance">0 $</strong><small>Montant à recevoir</small></article>
          <article><span>Profit estimé</span><strong id="d31Profit">0 $</strong><small>Avant impôts</small></article>
        </div><div class="grid-2"><article class="panel"><div class="panel-title"><h2>Alertes de gestion</h2></div><div id="d31Alerts"></div></article><article class="panel"><div class="panel-title"><h2>Résumé financier</h2><button data-go31="reports">Ouvrir les rapports</button></div><div id="d31Financial"></div></article></div>`;
        $('page-dashboard').appendChild(box);
        box.querySelector('[data-go31]').onclick=()=>showPage('reports');
      }
      $('d31Sales').textContent=fmt(s.gross); $('d31Paid').textContent=fmt(s.paid); $('d31Balance').textContent=fmt(s.balance); $('d31Profit').textContent=fmt(s.profit);
      const unsigned=(contracts||[]).filter(c=>c.status==='Brouillon').length;
      const unpaid=(salesFiles||[]).filter(sf=>num(sf.contracts?.balance_amount)>0).length;
      const archived=(vehicles||[]).filter(v=>v.status==='Archivé').length;
      $('d31Alerts').innerHTML=`<div class="alert-line"><strong>${unsigned}</strong><span>contrat(s) à signer</span></div><div class="alert-line"><strong>${unpaid}</strong><span>dossier(s) avec solde</span></div><div class="alert-line"><strong>${archived}</strong><span>véhicule(s) archivé(s)</span></div>`;
      $('d31Financial').innerHTML=`<div class="finance-line"><span>Valeur de l’inventaire</span><strong>${fmt(s.inventoryValue)}</strong></div><div class="finance-line"><span>Dépenses estimées</span><strong>${fmt(s.expenses)}</strong></div><div class="finance-line"><span>Véhicules disponibles</span><strong>${s.available.length}</strong></div><div class="finance-line"><span>Véhicules vendus</span><strong>${s.sold.length}</strong></div>`;
    }catch(e){console.warn('Dashboard 3.1',e);}
  }

  async function buildReport(){
    const type=$('reportType').value,from=$('reportFrom').value,to=$('reportTo').value;
    $('reportMessage').textContent='Chargement…'; reportRows=[];
    try{
      if(type==='sales'){
        reportColumns=['Date','Contrat','Client','Véhicule','Vente','Total','Statut'];
        reportRows=(contracts||[]).filter(c=>inRange(c.created_at,from,to)).map(c=>[dateISO(c.created_at),c.contract_number||'',c.customers?customerName(c.customers):'',c.vehicles?.title||[c.vehicles?.make,c.vehicles?.model,c.vehicles?.year].filter(Boolean).join(' '),num(c.sale_price),num(c.total_amount||c.sale_price),c.status||'']);
      }else if(type==='payments'){
        const rows=await fetchAll('payments','*, contracts(contract_number), sales_files(file_number)');
        reportColumns=['Date','Reçu','Dossier','Contrat','Méthode','Type','Montant'];
        reportRows=rows.filter(x=>inRange(x.paid_at,from,to)).map(x=>[dateISO(x.paid_at),x.receipt_number||'',x.sales_files?.file_number||'',x.contracts?.contract_number||'',x.payment_method||'',x.payment_type||'',num(x.amount)]);
      }else if(type==='expenses'){
        const rows=await fetchAll('vehicle_expenses','*, vehicles(title,vin)');
        reportColumns=['Date','Véhicule','VIN','Catégorie','Fournisseur','Description','Montant'];
        reportRows=rows.filter(x=>inRange(x.expense_date,from,to)).map(x=>[dateISO(x.expense_date),x.vehicles?.title||'',x.vehicles?.vin||'',x.category||'',x.supplier||'',x.description||'',num(x.amount)]);
      }else if(type==='inventory'||type==='sold'){
        const rows=(vehicles||[]).filter(v=>type==='sold'?v.status==='Vendu':!['Vendu','Archivé'].includes(v.status));
        reportColumns=['Véhicule','Année','VIN','Kilométrage','Prix','Coût achat','Statut'];
        reportRows=rows.map(v=>[v.title||[v.make,v.model].filter(Boolean).join(' '),v.year||'',v.vin||'',num(v.mileage),num(v.price),num(v.purchase_price||v.cost),v.status||'']);
      }else if(type==='profits'){
        const ex=await fetchAll('vehicle_expenses'); const byVehicle={}; ex.forEach(x=>byVehicle[x.vehicle_id]=(byVehicle[x.vehicle_id]||0)+num(x.amount));
        reportColumns=['Date','Véhicule','VIN','Prix vente','Coût total','Profit estimé','Statut'];
        reportRows=(contracts||[]).filter(c=>c.status!=='Annulé'&&inRange(c.created_at,from,to)).map(c=>{const v=c.vehicles||{},cost=num(v.purchase_price||v.cost)+num(v.preparation_cost)+num(v.transport_cost)+num(v.inspection_cost)+num(v.other_cost)+num(byVehicle[v.id]),sale=num(c.sale_price)+num(c.fees)-num(c.discount);return[dateISO(c.created_at),v.title||[v.make,v.model,v.year].filter(Boolean).join(' '),v.vin||'',sale,cost,sale-cost,c.status||''];});
      }
      renderReport(type); $('reportMessage').textContent=`${reportRows.length} résultat(s).`;
    }catch(e){$('reportMessage').textContent='Erreur: '+e.message;}
  }

  function renderReport(type){
    $('reportHead').innerHTML='<tr>'+reportColumns.map(c=>`<th>${esc31(c)}</th>`).join('')+'</tr>';
    $('reportBody').innerHTML=reportRows.map(r=>'<tr>'+r.map((v,i)=>`<td>${typeof v==='number'&&(['sales','payments','expenses','profits','inventory','sold'].includes(type))&&i>=3?fmt(v):esc31(v)}</td>`).join('')+'</tr>').join('')||`<tr><td colspan="${reportColumns.length}">Aucun résultat.</td></tr>`;
    const numeric=reportRows.reduce((a,r)=>a+r.filter(v=>typeof v==='number').reduce((x,y)=>x+y,0),0);
    $('reportStats').innerHTML=`<article><span>Résultats</span><strong>${reportRows.length}</strong><small>Lignes du rapport</small></article><article><span>Période</span><strong>${esc31($('reportFrom').value||'Début')} → ${esc31($('reportTo').value||'Aujourd’hui')}</strong><small>Filtre actif</small></article><article><span>Total indicatif</span><strong>${fmt(numeric)}</strong><small>Somme des colonnes numériques</small></article>`;
  }

  async function createBackup(){
    $('backupMessage').textContent='Création de la sauvegarde…';
    const tables=['vehicles','customers','contract_types','contracts','sales_files','payments','vehicle_expenses','company_settings','sales_documents','sales_signatures','sales_timeline'];
    try{
      const data={version:'3.1',created_at:new Date().toISOString(),project:'Sharbo Auto DMS',tables:{}};
      for(const t of tables){try{data.tables[t]=await fetchAll(t)}catch(e){data.tables[t]={error:e.message,rows:[]}}}
      download(`sharbo-auto-backup-${dateISO(new Date())}.json`,new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const summary=Object.entries(data.tables).map(([k,v])=>`<div><strong>${esc31(k)}</strong><span>${Array.isArray(v)?v.length:0} ligne(s)</span></div>`).join('');
      $('backupSummary').innerHTML=summary; $('backupMessage').textContent='Sauvegarde téléchargée avec succès.';
    }catch(e){$('backupMessage').textContent='Erreur: '+e.message;}
  }

  async function restoreBackup(){
    const file=$('restoreBackupFile').files[0]; if(!file){$('restoreMessage').textContent='Choisissez un fichier JSON.';return;}
    if(!confirm('Restaurer cette sauvegarde? Les enregistrements portant le même identifiant seront mis à jour.'))return;
    $('restoreMessage').textContent='Restauration en cours…';
    try{
      const data=JSON.parse(await file.text()); if(!data.tables)throw new Error('Format de sauvegarde invalide.');
      const order=['vehicles','customers','contract_types','contracts','sales_files','payments','vehicle_expenses','company_settings','sales_documents','sales_signatures','sales_timeline'];
      let total=0;
      for(const t of order){const rows=Array.isArray(data.tables[t])?data.tables[t]:[];if(!rows.length)continue;const {error}=await sb.from(t).upsert(rows,{onConflict:'id'});if(error)throw new Error(`${t}: ${error.message}`);total+=rows.length;}
      $('restoreMessage').textContent=`Restauration terminée: ${total} ligne(s). Rechargez la page.`;
    }catch(e){$('restoreMessage').textContent='Erreur: '+e.message;}
  }

  function globalSearch31(q){
    q=q.trim().toLowerCase(); if(!q)return;
    const v=(vehicles||[]).find(x=>`${x.title||''} ${x.make||''} ${x.model||''} ${x.year||''} ${x.vin||''} ${x.stock_number||''}`.toLowerCase().includes(q));
    if(v){showPage('inventory');inventorySearch.value=q;renderInventory();return;}
    const c=(customers||[]).find(x=>`${customerName(x)} ${x.phone||''} ${x.email||''} ${x.driver_license||''}`.toLowerCase().includes(q));
    if(c){showPage('customers');customerSearch.value=q;renderCustomers();return;}
    const k=(contracts||[]).find(x=>`${x.contract_number||''} ${x.vehicles?.vin||''} ${x.customers?customerName(x.customers):''}`.toLowerCase().includes(q));
    if(k){showPage('contracts');contractSearch.value=q;renderContracts();return;}
    const sf=(salesFiles||[]).find(x=>`${x.file_number||''} ${x.contracts?.contract_number||''} ${x.vehicles?.vin||''} ${x.customers?customerName(x.customers):''}`.toLowerCase().includes(q));
    if(sf){showPage('salesfiles');setTimeout(()=>openSalesFile(sf.id),100);return;}
    showPage('inventory'); inventorySearch.value=q; renderInventory();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    const now=new Date(),start=new Date(now.getFullYear(),now.getMonth(),1);$('reportFrom').value=dateISO(start);$('reportTo').value=dateISO(now);
    $('refreshReportsBtn').onclick=buildReport;$('reportType').onchange=buildReport;$('exportReportBtn').onclick=()=>download(`rapport-${$('reportType').value}-${dateISO(new Date())}.csv`,new Blob([csv([reportColumns,...reportRows])],{type:'text/csv;charset=utf-8'}));$('printReportsBtn').onclick=()=>window.print();
    $('createBackupBtn').onclick=createBackup;$('restoreBackupBtn').onclick=restoreBackup;
    const gs=$('globalSearch'); gs.replaceWith(gs.cloneNode(true)); const newGs=$('globalSearch'); let timer; newGs.addEventListener('input',e=>{clearTimeout(timer);timer=setTimeout(()=>globalSearch31(e.target.value),350)});
    document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.page==='reports')buildReport();if(b.dataset.page==='dashboard')setTimeout(enhanceDashboard,150)}));
    setTimeout(()=>{enhanceDashboard();buildReport();},1200);
  });
})();
