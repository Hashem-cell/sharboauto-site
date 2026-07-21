/* Sharbo Auto DMS 4.1 — Security, Mobile, Performance & Polish */
(() => {
  'use strict';
  const state = { role: 'admin', page: 1, perPage: 25, audit: [], theme: localStorage.getItem('sharbo-theme') || 'light' };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (v='') => String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function toast(message, type='success') {
    let host = $('#dmsToastHost');
    if (!host) { host=document.createElement('div'); host.id='dmsToastHost'; host.className='dms-toast-host'; document.body.appendChild(host); }
    const el=document.createElement('div'); el.className=`dms-toast ${type}`; el.innerHTML=`<span>${type==='success'?'✓':type==='error'?'!':'i'}</span><p>${esc(message)}</p>`;
    host.appendChild(el); requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),250)},3200);
  }
  window.dmsToast = toast;

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const b=$('#themeToggle41'); if(b) b.textContent=state.theme==='dark'?'☀️':'🌙';
  }

  function injectTopActions() {
    const top=$('.top-actions'); if(!top || $('#themeToggle41')) return;
    top.insertAdjacentHTML('afterbegin', `<span id="roleBadge41" class="role-badge41">Admin</span><button id="themeToggle41" class="icon-btn41" title="Mode sombre">🌙</button>`);
    $('#themeToggle41').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';localStorage.setItem('sharbo-theme',state.theme);applyTheme();};
    applyTheme();
  }

  async function ensureRole() {
    if (!window.sb) return;
    try {
      const {data:{user}}=await sb.auth.getUser(); if(!user) return;
      const email=(user.email||'').toLowerCase();
      let {data,error}=await sb.from('user_roles').select('*').eq('user_id',user.id).maybeSingle();
      if(error && !String(error.message).includes('does not exist')) console.warn(error);
      if(!data && email==='hashem@sharboauto.com') {
        const res=await sb.from('user_roles').upsert({user_id:user.id,email:user.email,role:'admin',active:true},{onConflict:'user_id'}).select().single();
        data=res.data;
      }
      state.role=data?.role||'admin';
      const badge=$('#roleBadge41'); if(badge) badge.textContent=({admin:'Admin',sales:'Ventes',finance:'Finance',read_only:'Lecture seule'})[state.role]||state.role;
      applyRolePermissions();
      await logAudit('session_open','Connexion au DMS 4.1',{email:user.email,role:state.role},false);
    } catch(e){ console.warn('DMS role:',e); }
  }

  function applyRolePermissions(){
    const readonly=state.role==='read_only';
    $$('button.primary, button.danger, .danger-button, input[type=file]').forEach(el=>{
      if(readonly && !el.closest('#page-reports') && el.id!=='themeToggle41'){el.disabled=true;el.title='Accès en lecture seule';}
    });
    document.body.classList.toggle('role-readonly',readonly);
  }

  async function logAudit(action, label, details={}, showToast=false){
    if(!window.sb) return;
    try{
      const {data:{user}}=await sb.auth.getUser();
      const row={user_id:user?.id||null,user_email:user?.email||null,action,label,details,page:location.hash||'#dashboard',user_agent:navigator.userAgent};
      const {error}=await sb.from('audit_logs').insert(row);
      if(error && !String(error.message).includes('does not exist')) console.warn(error);
      if(showToast) toast(label);
    }catch(e){console.warn(e)}
  }
  window.dmsAudit=logAudit;

  function setupAuditCapture(){
    document.addEventListener('click', e=>{
      const b=e.target.closest('button'); if(!b || b.id==='themeToggle41') return;
      const text=(b.textContent||b.title||'Action').trim().replace(/\s+/g,' ').slice(0,120);
      if(/Ajouter|Enregistrer|Supprimer|Archiver|Restaurer|Livrer|Finaliser|Importer|Publier|Masquer|Signer|paiement|coût/i.test(text))
        setTimeout(()=>logAudit('ui_action',text,{id:b.id||null}),250);
    },true);
  }

  function injectSecurityPage(){
    const settings=$('#page-settings'); if(!settings || $('#securityPanel41')) return;
    settings.insertAdjacentHTML('beforeend',`
      <article id="securityPanel41" class="panel security-panel41">
       <div class="split-head"><div><h2>🔐 Sécurité & journal</h2><p class="muted">Rôles, sessions et historique des actions importantes.</p></div><button id="refreshAudit41">Actualiser</button></div>
       <div class="role-grid41"><div><strong>Votre rôle</strong><span id="securityRole41">Admin</span></div><div><strong>Protection</strong><span>Supabase Auth + RLS</span></div><div><strong>Journal</strong><span>Actions sensibles enregistrées</span></div></div>
       <div class="table-wrap"><table><thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th></tr></thead><tbody id="auditBody41"><tr><td colspan="4">Chargement…</td></tr></tbody></table></div>
      </article>`);
    $('#refreshAudit41').onclick=loadAudit;
  }

  async function loadAudit(){
    const body=$('#auditBody41'); if(!body||!window.sb)return;
    body.innerHTML='<tr><td colspan="4"><div class="skeleton41"></div></td></tr>';
    try{
      const {data,error}=await sb.from('audit_logs').select('*').order('created_at',{ascending:false}).limit(100);
      if(error) throw error;
      body.innerHTML=(data||[]).map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('fr-CA')}</td><td>${esc(r.user_email||'Système')}</td><td>${esc(r.action)}</td><td>${esc(r.label||'')}</td></tr>`).join('')||'<tr><td colspan="4">Aucune action enregistrée.</td></tr>';
      $('#securityRole41').textContent=({admin:'Admin',sales:'Ventes',finance:'Finance',read_only:'Lecture seule'})[state.role]||state.role;
    }catch(e){body.innerHTML='<tr><td colspan="4">Exécutez le fichier SQL DMS 4.1 pour activer le journal.</td></tr>'}
  }

  function setupInventoryPagination(){
    const wrap=$('#page-inventory .table-wrap'); if(!wrap || $('#inventoryPager41')) return;
    wrap.insertAdjacentHTML('afterend',`<div id="inventoryPager41" class="pager41"><label>Par page <select id="perPage41"><option>10</option><option selected>25</option><option>50</option><option>100</option></select></label><span id="pagerInfo41"></span><div><button id="prevPage41">←</button><button id="nextPage41">→</button></div></div>`);
    $('#perPage41').onchange=e=>{state.perPage=Number(e.target.value);state.page=1;applyPagination();};
    $('#prevPage41').onclick=()=>{if(state.page>1){state.page--;applyPagination();}};
    $('#nextPage41').onclick=()=>{state.page++;applyPagination();};
    const body=$('#inventoryBody');
    new MutationObserver(()=>{state.page=1;applyPagination();lazyImages();applyRolePermissions();}).observe(body,{childList:true});
    applyPagination();
  }

  function applyPagination(){
    const rows=$$('#inventoryBody tr[data-vehicle-id]'); if(!rows.length)return;
    const pages=Math.max(1,Math.ceil(rows.length/state.perPage)); state.page=Math.min(state.page,pages);
    rows.forEach((r,i)=>r.hidden=!(i>=(state.page-1)*state.perPage&&i<state.page*state.perPage));
    const info=$('#pagerInfo41'); if(info) info.textContent=`${Math.min((state.page-1)*state.perPage+1,rows.length)}–${Math.min(state.page*state.perPage,rows.length)} sur ${rows.length}`;
    $('#prevPage41').disabled=state.page<=1; $('#nextPage41').disabled=state.page>=pages;
  }

  function lazyImages(){
    $$('img:not([loading])').forEach(img=>{img.loading='lazy';img.decoding='async';});
  }

  function injectPdfTools(){
    const ops=$('#page-operations .ops-buttons'); if(!ops || $('#pdfPack41')) return;
    const b=document.createElement('button'); b.id='pdfPack41'; b.textContent='Dossier PDF complet'; b.title='Imprime la fiche A4, le QR et les informations du véhicule';
    b.onclick=()=>{ const a=$('#printA440')||$$('#page-operations button').find(x=>/Fiche A4/i.test(x.textContent)); if(a){a.click();logAudit('pdf_export','Dossier PDF imprimé',{},true)}else toast('Choisissez un véhicule avant de créer le PDF','error'); };
    ops.appendChild(b);
  }

  function enhanceMobile(){
    $$('.table-wrap table').forEach(t=>t.setAttribute('role','table'));
    document.addEventListener('click',e=>{if(e.target.closest('.nav-link')&&innerWidth<900)$('.sidebar')?.classList.remove('open')});
  }

  function connectionBanner(){
    window.addEventListener('offline',()=>toast('Connexion Internet perdue. Les modifications ne seront pas enregistrées.','error'));
    window.addEventListener('online',()=>toast('Connexion rétablie.'));
  }

  function polishLoading(){
    $$('.page').forEach(p=>p.classList.add('page-ready41'));
    const status=$('#connectionStatus'); if(status) status.title='Connexion sécurisée à Supabase';
  }

  async function init(){
    injectTopActions(); injectSecurityPage(); setupAuditCapture(); setupInventoryPagination(); injectPdfTools(); enhanceMobile(); lazyImages(); connectionBanner(); polishLoading();
    await ensureRole(); loadAudit();
    toast('DMS 4.1 prêt — sécurité, mobile et performance activés.');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700)); else setTimeout(init,700);
})();
