const sb = window.supabase.createClient(window.SHARBO_SUPABASE_URL, window.SHARBO_SUPABASE_KEY);
let vehicles=[];
let customers=[];
let contracts=[];
let contractTypes=[];
let companySettings=null;
let salesFiles=[];
let contractStep=1;
let photoItems=[];
let initialExistingPhotoIds=[];
const money=n=>Number(n||0).toLocaleString('fr-CA',{style:'currency',currency:'CAD'});
const km=n=>Number(n||0).toLocaleString('fr-CA')+' km';
const image=v=>(v.images&&v.images[0])||'../assets/images/logo.png';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function normalize(row){const detailed=(row.vehicle_images||[]).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));return {...row,brand:row.make,title:row.title||[row.make,row.model,row.year].filter(Boolean).join(' '),vehicle_images:detailed,images:detailed.map(x=>x.image_url)}}
async function requireAuth(){const {data:{session}}=await sb.auth.getSession();document.querySelector('#loginScreen').classList.toggle('hidden',!!session);if(session){await Promise.all([loadVehicles(),loadCustomers(),loadContractTypes(),loadCompanySettings()]);await loadContracts();await loadSalesFiles()}}
async function loadVehicles(){const {data,error}=await sb.from('vehicles').select('*, vehicle_images(*)').order('pinned',{ascending:false}).order('display_order',{ascending:true}).order('created_at',{ascending:false});if(error){setStatus('Erreur Supabase');console.error(error);vehicles=[]}else{vehicles=(data||[]).map(normalize);setStatus('Connecté à Supabase')}renderAll()}
function setStatus(t){document.querySelector('#connectionStatus').textContent=t}
function renderAll(){const total=vehicles.length,available=vehicles.filter(v=>(v.status||'Disponible')==='Disponible').length,sold=vehicles.filter(v=>String(v.status).toLowerCase().includes('vend')).length;statTotal.textContent=total;statAvailable.textContent=available;statSold.textContent=sold;statValue.textContent=money(vehicles.reduce((s,v)=>s+Number(v.price||0),0));recentVehicles.innerHTML=vehicles.slice(0,5).map(v=>`<div class="vehicle-row"><img src="${esc(image(v))}"><div><strong>${esc(v.title)}</strong><small>${km(v.mileage)} · ${esc(v.status||'Disponible')}</small></div><b>${money(v.price)}</b></div>`).join('')||'<p>Aucun véhicule.</p>';renderBars(total);renderInventory()}
function renderBars(total){const groups=['Disponible','Réservé','Vendu'].map(name=>({name,count:vehicles.filter(v=>String(v.status||'Disponible').toLowerCase().startsWith(name.toLowerCase().slice(0,4))).length}));statusBars.innerHTML=groups.map(g=>`<div><div class="bar-label"><span>${g.name}</span><strong>${g.count}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${total?g.count/total*100:0}%"></div></div></div>`).join('')}
function sortedInventoryList(){
 const q=(inventorySearch?.value||globalSearch?.value||'').toLowerCase(),status=statusFilter?.value||'',mode=inventorySort?.value||'manual';
 let list=vehicles.filter(v=>{const archived=!!v.archived_at;const statusMatch=status==='Archivé'?archived:(!archived&&(!status||v.status===status));return (!q||`${v.title} ${v.make} ${v.model} ${v.year} ${v.vin}`.toLowerCase().includes(q))&&statusMatch});
 const n=x=>Number(x||0),d=x=>new Date(x||0).getTime();
 if(mode==='newest')list.sort((a,b)=>d(b.created_at)-d(a.created_at));
 else if(mode==='oldest')list.sort((a,b)=>d(a.created_at)-d(b.created_at));
 else if(mode==='price_desc')list.sort((a,b)=>n(b.price)-n(a.price));
 else if(mode==='price_asc')list.sort((a,b)=>n(a.price)-n(b.price));
 else if(mode==='km_asc')list.sort((a,b)=>n(a.mileage)-n(b.mileage));
 else if(mode==='km_desc')list.sort((a,b)=>n(b.mileage)-n(a.mileage));
 else if(mode==='featured')list.sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||n(a.display_order)-n(b.display_order));
 else list.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||n(a.display_order)-n(b.display_order)||d(b.created_at)-d(a.created_at));
 return list;
}
function renderInventory(){const list=sortedInventoryList();inventoryBody.innerHTML=list.map((v,i)=>`<tr draggable="${(inventorySort?.value||'manual')==='manual'}" data-vehicle-id="${v.id}" class="${v.pinned?'pinned-row':''}"><td class="order-cell"><span class="drag-handle" title="Glisser">☰</span><strong>${i+1}</strong><div class="move-buttons"><button type="button" onclick="moveVehicle('${v.id}',-1)">↑</button><button type="button" onclick="moveVehicle('${v.id}',1)">↓</button></div></td><td><div class="car-cell"><img src="${esc(image(v))}"><div><strong>${v.pinned?'📌 ':''}${v.featured?'⭐ ':''}${esc(v.title)}</strong><small>${esc(v.vin||'')}</small></div></div></td><td>${esc(v.year||'')}</td><td>${km(v.mileage)}</td><td>${money(v.price)}</td><td><span class="badge ${String(v.status).toLowerCase().includes('vend')?'sold':''}">${esc(v.status||'Disponible')}</span></td><td><button class="table-btn ${v.pinned?'active-toggle':''}" onclick="toggleVehicleFlag('${v.id}','pinned',${!v.pinned})">📌</button><button class="table-btn ${v.featured?'active-toggle':''}" onclick="toggleVehicleFlag('${v.id}','featured',${!v.featured})">⭐</button></td><td><button class="table-btn" onclick="editVehicle('${v.id}')">Modifier</button>${v.archived_at?`<button class="table-btn" onclick="restoreVehicle('${v.id}')">Restaurer</button>`:`<button class="table-btn" onclick="archiveVehicle('${v.id}')">Archiver</button>`}<button class="table-btn danger" onclick="deleteVehicle('${v.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="8">Aucun véhicule trouvé.</td></tr>';bindInventoryDrag()}
window.moveVehicle=(id,delta)=>{if((inventorySort?.value||'manual')!=='manual'){inventorySort.value='manual'}const ordered=sortedInventoryList(),i=ordered.findIndex(v=>v.id===id),j=i+delta;if(i<0||j<0||j>=ordered.length)return;[ordered[i],ordered[j]]=[ordered[j],ordered[i]];ordered.forEach((v,k)=>v.display_order=k+1);vehicles.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||Number(a.display_order)-Number(b.display_order));renderInventory();inventoryOrderMessage.textContent='Ordre modifié — cliquez sur Enregistrer l’ordre.'};
window.toggleVehicleFlag=async(id,field,value)=>{inventoryOrderMessage.textContent='Enregistrement…';const {error}=await sb.from('vehicles').update({[field]:value,updated_at:new Date().toISOString()}).eq('id',id);if(error){inventoryOrderMessage.textContent='Erreur: '+error.message;return}const v=vehicles.find(x=>x.id===id);if(v)v[field]=value;renderInventory();inventoryOrderMessage.textContent=field==='pinned'?'Épinglage enregistré.':'Vedette enregistrée.'};
async function saveInventoryOrder(){const ordered=[...inventoryBody.querySelectorAll('tr[data-vehicle-id]')].map((tr,i)=>({id:tr.dataset.vehicleId,display_order:i+1}));inventoryOrderMessage.textContent='Enregistrement de l’ordre…';for(const row of ordered){const {error}=await sb.from('vehicles').update({display_order:row.display_order}).eq('id',row.id);if(error){inventoryOrderMessage.textContent='Erreur: '+error.message;return}}ordered.forEach(row=>{const v=vehicles.find(x=>x.id===row.id);if(v)v.display_order=row.display_order});inventoryOrderMessage.textContent='Ordre enregistré et appliqué au site.';renderInventory()}
function bindInventoryDrag(){let dragged=null;inventoryBody.querySelectorAll('tr[draggable="true"]').forEach(row=>{row.addEventListener('dragstart',()=>{dragged=row;row.classList.add('dragging')});row.addEventListener('dragend',()=>{row.classList.remove('dragging');dragged=null;inventoryOrderMessage.textContent='Ordre modifié — cliquez sur Enregistrer l’ordre.'});row.addEventListener('dragover',e=>{e.preventDefault();if(!dragged||dragged===row)return;const box=row.getBoundingClientRect();inventoryBody.insertBefore(dragged,e.clientY<box.top+box.height/2?row:row.nextSibling)});});}
function showPage(name){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===name));document.querySelector('#page-'+name)?.classList.add('active');document.querySelector('.sidebar').classList.remove('open');history.replaceState(null,'','#'+name)}
function calculate(){const f=new FormData(financeCalculator),n=k=>Number(f.get(k)||0);let principal=n('vehiclePrice')-n('tradeValue')+n('tradeBalance')+n('managementFee')+n('warranty')+n('rdrpm')+n('transit')-n('downPayment');if(f.get('includeTaxes'))principal*=1.14975;principal=Math.max(0,principal);const months=n('term'),ppy=n('frequency'),periods=Math.round(months/12*ppy),rate=n('interestRate')/100/ppy,payment=rate?principal*rate*(1+rate)**periods/((1+rate)**periods-1):(periods?principal/periods:0),total=payment*periods;paymentResult.textContent=money(payment);loanResult.textContent=money(principal);interestResult.textContent=money(Math.max(0,total-principal));costResult.textContent=money(total)}
function openVehicle(v=null){
 vehicleForm.reset();vehicleForm.elements.id.value=v?.id||'';vehicleModalTitle.textContent=v?'Modifier le véhicule':'Ajouter un véhicule';
 for(const n of ['title','stock_number','vin','make','model','trim','year','mileage','price','cost','transmission','fuel','color','engine','status','carfax','description_fr','description_en','display_order'])if(v&&vehicleForm.elements[n])vehicleForm.elements[n].value=v[n]??'';
 vehicleForm.elements.featured.checked=!!v?.featured;vehicleForm.elements.pinned.checked=!!v?.pinned;
 photoItems=(v?.vehicle_images||[]).map(x=>({type:'existing',id:x.id,url:x.image_url}));initialExistingPhotoIds=photoItems.map(x=>x.id);renderPhotoManager();
 vehicleFormMessage.textContent='';vehicleModal.classList.add('open')
}
window.editVehicle=id=>openVehicle(vehicles.find(v=>v.id===id));
window.archiveVehicle=async id=>{if(!confirm('Archiver ce véhicule? Il disparaîtra du site public.'))return;const {error}=await sb.from('vehicles').update({archived_at:new Date().toISOString()}).eq('id',id);if(error)alert(error.message);else await loadVehicles()};
window.restoreVehicle=async id=>{const {error}=await sb.from('vehicles').update({archived_at:null}).eq('id',id);if(error)alert(error.message);else await loadVehicles()};
window.deleteVehicle=async id=>{if(!confirm('Supprimer définitivement ce véhicule? Cette action est irréversible.'))return;const {error}=await sb.from('vehicles').delete().eq('id',id);if(error)alert(error.message);else await loadVehicles()};
function renderPhotoManager(){
 const box=document.querySelector('#photoManager');if(!box)return;
 box.innerHTML=photoItems.map((x,i)=>`<div class="photo-item" draggable="true" data-photo-index="${i}"><span class="photo-drag">☰</span><img src="${esc(x.url)}"><div><strong>${i===0?'Photo principale':'Photo '+(i+1)}</strong><small>${x.type==='new'?'Nouvelle photo':'Photo enregistrée'}</small></div><div class="photo-actions"><button type="button" onclick="movePhoto(${i},-1)">↑</button><button type="button" onclick="movePhoto(${i},1)">↓</button><button type="button" class="danger" onclick="removePhoto(${i})">×</button></div></div>`).join('')||'<p class="photo-empty">Aucune photo. La première photo choisie deviendra la photo principale.</p>';
 bindPhotoDrag();
}
window.movePhoto=(i,d)=>{const j=i+d;if(j<0||j>=photoItems.length)return;[photoItems[i],photoItems[j]]=[photoItems[j],photoItems[i]];renderPhotoManager()};
window.removePhoto=i=>{const [x]=photoItems.splice(i,1);if(x?.type==='new'&&x.url.startsWith('blob:'))URL.revokeObjectURL(x.url);renderPhotoManager()};
function bindPhotoDrag(){let from=null;document.querySelectorAll('#photoManager .photo-item').forEach(el=>{el.addEventListener('dragstart',()=>{from=Number(el.dataset.photoIndex);el.classList.add('dragging')});el.addEventListener('dragend',()=>{el.classList.remove('dragging');from=null});el.addEventListener('dragover',e=>e.preventDefault());el.addEventListener('drop',e=>{e.preventDefault();const to=Number(el.dataset.photoIndex);if(from===null||from===to)return;const [item]=photoItems.splice(from,1);photoItems.splice(to,0,item);renderPhotoManager()})})}
vehicleForm.elements.images.addEventListener('change',e=>{for(const file of [...e.target.files])photoItems.push({type:'new',file,url:URL.createObjectURL(file)});e.target.value='';renderPhotoManager()});
async function syncVehicleImages(vehicleId){
 const keepIds=photoItems.filter(x=>x.type==='existing').map(x=>x.id),removeIds=initialExistingPhotoIds.filter(id=>!keepIds.includes(id));
 if(removeIds.length){const {error}=await sb.from('vehicle_images').delete().in('id',removeIds);if(error)throw error}
 for(let i=0;i<photoItems.length;i++){
  const item=photoItems[i];
  if(item.type==='existing'){const {error}=await sb.from('vehicle_images').update({sort_order:i,cover:i===0}).eq('id',item.id);if(error)throw error;continue}
  const ext=(item.file.name.split('.').pop()||'jpg').toLowerCase(),path=`${vehicleId}/${Date.now()}-${i}-${Math.random().toString(36).slice(2,7)}.${ext}`;
  const {error}=await sb.storage.from(window.SHARBO_STORAGE_BUCKET).upload(path,item.file,{upsert:false});if(error)throw error;
  const {data}=sb.storage.from(window.SHARBO_STORAGE_BUCKET).getPublicUrl(path);
  const inserted=await sb.from('vehicle_images').insert({vehicle_id:vehicleId,image_url:data.publicUrl,cover:i===0,sort_order:i}).select().single();if(inserted.error)throw inserted.error;
  item.type='existing';item.id=inserted.data.id;item.url=data.publicUrl;delete item.file;
 }
 initialExistingPhotoIds=photoItems.map(x=>x.id);
}
vehicleForm.addEventListener('submit',async e=>{
 e.preventDefault();const fd=new FormData(vehicleForm),id=fd.get('id');
 const automaticTopOrder=vehicles.length?Math.min(...vehicles.filter(v=>!v.archived_at).map(v=>Number(v.display_order||0)))-1:0;
 const payload={title:fd.get('title'),stock_number:fd.get('stock_number')||null,vin:fd.get('vin')||null,make:fd.get('make'),model:fd.get('model'),trim:fd.get('trim')||null,year:Number(fd.get('year'))||null,mileage:Number(fd.get('mileage'))||0,price:Number(fd.get('price'))||0,cost:Number(fd.get('cost'))||0,transmission:fd.get('transmission')||null,fuel:fd.get('fuel')||null,color:fd.get('color')||null,engine:fd.get('engine')||null,status:fd.get('status')||'Disponible',carfax:fd.get('carfax')||null,description_fr:fd.get('description_fr')||null,description_en:fd.get('description_en')||null,featured:fd.get('featured')==='on',pinned:fd.get('pinned')==='on',display_order:fd.get('display_order')!==''?Number(fd.get('display_order')):(id?Number(vehicles.find(v=>v.id===id)?.display_order||0):automaticTopOrder)};
 vehicleFormMessage.textContent='Enregistrement…';let result;
 if(id)result=await sb.from('vehicles').update(payload).eq('id',id).select().single();else result=await sb.from('vehicles').insert(payload).select().single();
 if(result.error){vehicleFormMessage.textContent=result.error.message;return}
 try{await syncVehicleImages(result.data.id);vehicleFormMessage.textContent='Enregistré. La nouvelle voiture apparaît en premier et l’ordre des photos est sauvegardé.';setTimeout(()=>vehicleModal.classList.remove('open'),650);await loadVehicles()}catch(err){vehicleFormMessage.textContent='Véhicule enregistré, mais erreur photo: '+err.message}
});
async function importLegacy(){importMessage.textContent='Importation…';const r=await fetch('../data/vehicles.json',{cache:'no-store'}),d=await r.json();let ok=0,skip=0;for(const v of d.vehicles||[]){const payload={title:v.title||v.id,vin:(v.vin||'').trim()||null,make:v.brand||'',model:v.model||'',year:Number(v.year)||null,mileage:Number(v.mileage)||0,price:Number(v.price)||0,transmission:v.transmission||null,fuel:v.fuel||null,status:v.status||'Disponible',carfax:v.carfax||null,description_fr:v.description_fr||null,description_en:v.description_en||null,featured:v.featured!==false};const {data,error}=await sb.from('vehicles').insert(payload).select().single();if(error){skip++;continue}const imgs=(v.images||[]).map((u,i)=>({vehicle_id:data.id,image_url:new URL(u,location.origin).href,cover:i===0,sort_order:i}));if(imgs.length)await sb.from('vehicle_images').insert(imgs);ok++}importMessage.textContent=`${ok} importés, ${skip} ignorés.`;await loadVehicles()}

async function loadCustomers(){const {data,error}=await sb.from('customers').select('*').order('created_at',{ascending:false});if(error){console.error(error);customers=[]}else customers=data||[];renderCustomers()}
function customerName(c){return (c.company||[c.first_name,c.last_name].filter(Boolean).join(' ')||'Client sans nom').trim()}
function renderCustomers(){if(!window.customersBody)return;const q=(customerSearch?.value||'').toLowerCase(),type=customerTypeFilter?.value||'';const list=customers.filter(c=>(!q||`${customerName(c)} ${c.phone||''} ${c.email||''} ${c.driver_license||''}`.toLowerCase().includes(q))&&(!type||c.customer_type===type));customerTotal.textContent=customers.length;customerEmailCount.textContent=customers.filter(c=>c.email).length;const now=new Date();customerMonthCount.textContent=customers.filter(c=>{const d=new Date(c.created_at);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear()}).length;customersBody.innerHTML=list.map(c=>`<tr><td><div class="client-cell"><span class="avatar">${esc(customerName(c).slice(0,2).toUpperCase())}</span><div><strong>${esc(customerName(c))}</strong><small>${esc(c.driver_license||'')}</small></div></div></td><td>${esc(c.phone||'—')}</td><td>${esc(c.email||'—')}</td><td>${esc([c.city,c.province].filter(Boolean).join(', ')||'—')}</td><td><span class="badge">${esc(c.customer_type||'Particulier')}</span></td><td><button class="table-btn" onclick="editCustomer('${c.id}')">Modifier</button><button class="table-btn danger" onclick="deleteCustomer('${c.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="6">Aucun client trouvé.</td></tr>'}
function openCustomer(c=null){customerForm.reset();customerForm.elements.id.value=c?.id||'';customerModalTitle.textContent=c?'Modifier le client':'Ajouter un client';for(const n of ['customer_type','first_name','last_name','company','phone','email','birth_date','driver_license','address','city','province','postal_code','country','notes'])if(c&&customerForm.elements[n])customerForm.elements[n].value=c[n]??'';if(!c){customerForm.elements.customer_type.value='Particulier';customerForm.elements.province.value='QC';customerForm.elements.country.value='Canada'}customerFormMessage.textContent='';customerModal.classList.add('open')}
window.editCustomer=id=>openCustomer(customers.find(c=>c.id===id));
window.deleteCustomer=async id=>{if(!confirm('Supprimer ce client?'))return;const {error}=await sb.from('customers').delete().eq('id',id);if(error)alert(error.message);else await loadCustomers()};
customerForm.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(customerForm),id=fd.get('id'),payload={customer_type:fd.get('customer_type')||'Particulier',first_name:fd.get('first_name')||null,last_name:fd.get('last_name')||null,company:fd.get('company')||null,phone:fd.get('phone')||null,email:fd.get('email')||null,birth_date:fd.get('birth_date')||null,driver_license:fd.get('driver_license')||null,address:fd.get('address')||null,city:fd.get('city')||null,province:fd.get('province')||null,postal_code:fd.get('postal_code')||null,country:fd.get('country')||null,notes:fd.get('notes')||null,updated_at:new Date().toISOString()};if(!payload.first_name&&!payload.last_name&&!payload.company){customerFormMessage.textContent='Ajoutez un nom ou une entreprise.';return}customerFormMessage.textContent='Enregistrement…';const result=id?await sb.from('customers').update(payload).eq('id',id):await sb.from('customers').insert(payload);if(result.error){customerFormMessage.textContent=result.error.message;return}customerFormMessage.textContent='Client enregistré.';await loadCustomers();setTimeout(()=>customerModal.classList.remove('open'),450)});



async function loadContractTypes(){
  const formSelect=contractForm?.elements?.contract_type;
  if(formSelect){formSelect.disabled=true;formSelect.innerHTML='<option value="">Chargement des types…</option>';}
  try{
    const {data,error}=await sb.from('contract_types').select('id, code, french_name, english_name').order('french_name');
    if(error)throw error;
    contractTypes=data||[];
    fillContractTypeOptions();
    if(formSelect)formSelect.disabled=false;
    return contractTypes;
  }catch(error){
    console.error('Erreur contract_types:',error);
    contractTypes=[];
    if(formSelect){formSelect.disabled=false;formSelect.innerHTML='<option value="">Types indisponibles — exécutez le correctif SQL V4.2</option>';}
    if(window.contractTypeFilter)contractTypeFilter.innerHTML='<option value="">Types indisponibles</option>';
    return [];
  }
}
function contractTypeName(type,language='fr'){
  if(!type)return '—';
  if(typeof type==='object')return language==='en'?(type.english_name||type.french_name||type.code):(type.french_name||type.english_name||type.code);
  const found=contractTypes.find(t=>t.id===type);
  return found?contractTypeName(found,language):type;
}
function fillContractTypeOptions(selected=''){
  const formSelect=contractForm?.elements?.contract_type;
  const options=contractTypes.map(t=>`<option value="${t.id}">${esc(t.french_name||t.english_name||t.code)}</option>`).join('');
  const defaultId=selected||contractTypes.find(t=>t.code==='sale')?.id||contractTypes[0]?.id||'';
  if(formSelect){
    formSelect.innerHTML='<option value="">Sélectionner un type</option>'+options;
    formSelect.value=defaultId;
    formSelect.setCustomValidity(contractTypes.length?'':'Les types de contrats ne sont pas accessibles.');
  }
  if(window.contractTypeFilter){contractTypeFilter.innerHTML='<option value="">Tous les types</option>'+options;contractTypeFilter.value='';}
}
async function loadContracts(){
  const {data,error}=await sb.from('contracts').select('*, customers(*), vehicles(*), contract_types:contract_type(id, code, french_name, english_name)').order('created_at',{ascending:false});
  if(error){console.error(error);contracts=[]}else contracts=data||[];
  renderContracts();
}

async function ensureSalesFile(contract){
  if(!contract?.id)return null;
  const {data:existing,error:findError}=await sb.from('sales_files').select('*').eq('contract_id',contract.id).maybeSingle();
  if(findError)throw findError;
  if(existing){
    const {data,error}=await sb.from('sales_files').update({customer_id:contract.customer_id,vehicle_id:contract.vehicle_id,updated_at:new Date().toISOString()}).eq('id',existing.id).select().single();
    if(error)throw error;return data;
  }
  const year=new Date().getFullYear();
  const fileNumber=`DV-${year}-${String(contract.contract_number||contract.id).replace(/\D/g,'').slice(-5).padStart(5,'0')}`;
  const {data,error}=await sb.from('sales_files').insert({file_number:fileNumber,contract_id:contract.id,customer_id:contract.customer_id,vehicle_id:contract.vehicle_id,status:'En cours'}).select().single();
  if(error)throw error;return data;
}
async function loadSalesFiles(){
  if(!window.salesFilesBody)return;
  const {data,error}=await sb.from('sales_files').select('*, contracts(*), customers(*), vehicles(*)').order('created_at',{ascending:false});
  if(error){console.error('Sales files:',error);salesFiles=[];salesFilesMessage.textContent='Erreur: '+error.message;}
  else{salesFiles=data||[];salesFilesMessage.textContent='';}
  renderSalesFiles();
}
function renderSalesFiles(){
  if(!window.salesFilesBody)return;
  salesFileTotal.textContent=salesFiles.length;
  salesFileOpen.textContent=salesFiles.filter(x=>!['Complété','Livré','Fermé'].includes(x.status)).length;
  salesFileDone.textContent=salesFiles.filter(x=>['Complété','Livré','Fermé'].includes(x.status)).length;
  salesFileBalance.textContent=money(salesFiles.reduce((sum,x)=>sum+Number(x.contracts?.balance_amount||0),0));
  salesFilesBody.innerHTML=salesFiles.map(sf=>{const c=sf.contracts||{},u=sf.customers||{},v=sf.vehicles||{};return `<tr><td><strong>${esc(sf.file_number||'Dossier')}</strong><small class="block-muted">${new Date(sf.created_at).toLocaleDateString('fr-CA')}</small></td><td>${esc(customerName(u))}<small class="block-muted">${esc(u.phone||u.email||'')}</small></td><td><strong>${esc(v.title||[v.make,v.model,v.year].filter(Boolean).join(' ')||'—')}</strong><small class="block-muted">${esc(v.vin||'')}</small></td><td>${esc(c.contract_number||'—')}</td><td>${money(c.total_amount||c.sale_price)}</td><td>${money(c.balance_amount||0)}</td><td><span class="badge">${esc(sf.status||'En cours')}</span></td><td><button class="table-btn" onclick="openSalesFile('${sf.id}')">Ouvrir le dossier</button></td></tr>`}).join('')||'<tr><td colspan="8">Aucun dossier de vente.</td></tr>';
}
async function repairMissingSalesFiles(){
  salesFilesMessage.textContent='Synchronisation…';
  try{for(const c of contracts)await ensureSalesFile(c);await loadSalesFiles();salesFilesMessage.textContent='Dossiers synchronisés.';}catch(e){salesFilesMessage.textContent='Erreur: '+e.message;}
}
window.repairMissingSalesFiles=repairMissingSalesFiles;
function contractCustomerName(c){return c?.customers?customerName(c.customers):'—'}
function contractVehicleName(c){const v=c?.vehicles;return v?(v.title||[v.make,v.model,v.year].filter(Boolean).join(' ')):'—'}
function contractNumber(c){return c.contract_number||'—'}
function contractBadge(status){return String(status||'Brouillon').toLowerCase()==='signé'?'signed':String(status||'').toLowerCase()==='annulé'?'cancelled':''}
function renderContracts(){
  if(!window.contractsBody)return;
  const q=(contractSearch?.value||'').toLowerCase(),status=contractStatusFilter?.value||'',type=contractTypeFilter?.value||'';
  const list=contracts.filter(c=>{const text=`${contractNumber(c)} ${contractCustomerName(c)} ${contractVehicleName(c)} ${c.vehicles?.vin||''}`.toLowerCase();return(!q||text.includes(q))&&(!status||c.status===status)&&(!type||c.contract_type===type)});
  contractTotal.textContent=contracts.length;
  contractDraftCount.textContent=contracts.filter(c=>c.status==='Brouillon').length;
  contractSignedCount.textContent=contracts.filter(c=>c.status==='Signé').length;
  contractValue.textContent=money(contracts.reduce((s,c)=>s+Number(c.sale_price||0),0));
  contractsBody.innerHTML=list.map(c=>`<tr><td><strong>${esc(contractNumber(c))}</strong><small class="block-muted">${esc((c.language||'fr').toUpperCase())}</small></td><td>${esc(contractCustomerName(c))}</td><td><strong>${esc(contractVehicleName(c))}</strong><small class="block-muted">${esc(c.vehicles?.vin||'')}</small></td><td>${esc(contractTypeName(c.contract_types,c.language||'fr'))}</td><td>${money(c.sale_price)}</td><td><span class="badge ${contractBadge(c.status)}">${esc(c.status||'Brouillon')}</span></td><td>${new Date(c.created_at).toLocaleDateString('fr-CA')}</td><td><button class="table-btn" onclick="openContractDocument('${c.id}')">Ouvrir</button><button class="table-btn" onclick="editContract('${c.id}')">Modifier</button><button class="table-btn danger" onclick="deleteContract('${c.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="8">Aucun contrat trouvé.</td></tr>';
}
function fillContractSelects(selectedCustomer='',selectedVehicle=''){
  contractCustomer.innerHTML='<option value="">Sélectionner un client</option>'+customers.map(c=>`<option value="${c.id}">${esc(customerName(c))}${c.phone?' · '+esc(c.phone):''}</option>`).join('');
  contractVehicle.innerHTML='<option value="">Sélectionner un véhicule</option>'+vehicles.map(v=>`<option value="${v.id}">${esc(v.title)}${v.vin?' · '+esc(v.vin):''}</option>`).join('');
  contractCustomer.value=selectedCustomer||'';contractVehicle.value=selectedVehicle||'';renderContractVehiclePreview();
}
function setContractStep(step){contractStep=Math.max(1,Math.min(4,step));document.querySelectorAll('.contract-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===contractStep));document.querySelectorAll('[data-step-dot]').forEach(x=>x.classList.toggle('active',Number(x.dataset.stepDot)<=contractStep));contractStepLabel.textContent=`Étape ${contractStep} sur 4`;contractPrevBtn.style.visibility=contractStep===1?'hidden':'visible';contractNextBtn.classList.toggle('hidden',contractStep===4);contractSaveBtn.classList.toggle('hidden',contractStep!==4);if(contractStep===4)renderContractReview()}
function renderContractVehiclePreview(){const v=vehicles.find(x=>x.id===contractVehicle.value);contractVehiclePreview.innerHTML=v?`<img src="${esc(image(v))}"><div><strong>${esc(v.title)}</strong><small>${esc(v.vin||'Sans VIN')} · ${km(v.mileage)}</small><b>${money(v.price)}</b></div>`:'';if(v&&!contractForm.elements.id.value)contractForm.elements.sale_price.value=Number(v.price||0)}
function renderContractReview(){const fd=new FormData(contractForm),c=customers.find(x=>x.id===fd.get('customer_id')),v=vehicles.find(x=>x.id===fd.get('vehicle_id')),price=Number(fd.get('sale_price')||0),fees=Number(fd.get('fees')||0),discount=Number(fd.get('discount')||0),gst=(price+fees-discount)*Number(fd.get('gst_rate')||0)/100,qst=(price+fees-discount)*Number(fd.get('qst_rate')||0)/100,total=price+fees-discount+gst+qst,deposit=Number(fd.get('deposit')||0);contractReview.innerHTML=`<div><span>Client</span><strong>${esc(c?customerName(c):'—')}</strong></div><div><span>Véhicule</span><strong>${esc(v?.title||'—')}</strong></div><div><span>Type / Langue</span><strong>${esc(contractTypeName(fd.get('contract_type'),fd.get('language')))} · ${esc(String(fd.get('language')).toUpperCase())}</strong></div><div><span>Prix</span><strong>${money(price)}</strong></div><div><span>TPS</span><strong>${money(gst)}</strong></div><div><span>TVQ</span><strong>${money(qst)}</strong></div><div><span>Total</span><strong>${money(total)}</strong></div><div><span>Dépôt</span><strong>${money(deposit)}</strong></div><div class="review-balance"><span>Solde</span><strong>${money(Math.max(0,total-deposit))}</strong></div>`}
function openContract(c=null){contractForm.reset();contractForm.elements.id.value=c?.id||'';contractModalTitle.textContent=c?'Modifier le contrat':'Nouveau contrat';fillContractSelects(c?.customer_id,c?.vehicle_id);fillContractTypeOptions(c?.contract_type||'');for(const n of ['language','status','sale_price','deposit','fees','discount','gst_rate','qst_rate','notes'])if(c&&contractForm.elements[n])contractForm.elements[n].value=c[n]??'';if(!c){const d=getDealerSettings();contractForm.elements.language.value='fr';contractForm.elements.status.value='Brouillon';contractForm.elements.gst_rate.value=String(d.gst_rate||5);contractForm.elements.qst_rate.value=String(d.qst_rate||9.975);contractForm.elements.fees.value=String(d.default_admin_fee||0)}contractFormMessage.textContent='';setContractStep(1);contractModal.classList.add('open')}
window.editContract=id=>openContract(contracts.find(c=>c.id===id));
window.deleteContract=async id=>{if(!confirm('Supprimer ce contrat?'))return;const {error}=await sb.from('contracts').delete().eq('id',id);if(error)alert(error.message);else await loadContracts()};
let activeDocumentContractId=null;
function getDealerSettings(){
  const defaults={business_name:'Sharbo Auto',legal_name:'',phone:'438-927-7272',mobile:'',email:'hashem@sharboauto.com',website:'https://sharboauto.com',address:'',city:'',province:'Québec',postal_code:'',country:'Canada',logo_url:'../assets/images/logo.png',neq:'',gst_number:'',qst_number:'',saaq_dealer_number:'',licence_number:'',amvoq_number:'',gst_rate:5,qst_rate:9.975,default_admin_fee:0,currency:'CAD',document_footer:'',terms_fr:'',terms_en:'',default_seller_name:'',default_seller_email:'',default_seller_phone:''};
  return {...defaults,...(companySettings||{})};
}
function dealerFullAddress(d){return [d.address,d.city,d.province,d.postal_code,d.country].filter(Boolean).join(', ')||'—'}
async function loadCompanySettings(){
  const {data,error}=await sb.from('company_settings').select('*').limit(1).maybeSingle();
  if(error){console.error('Company settings:',error);settingsSaved.textContent='Exécutez le fichier SQL V5 dans Supabase.';companySettings=getDealerSettings();}
  else companySettings=data||getDealerSettings();
  fillSettingsForm();renderSettingsPreview();
}
function fillSettingsForm(){const d=getDealerSettings();for(const [k,v] of Object.entries(d))if(settingsForm.elements[k])settingsForm.elements[k].value=v??''}
function renderSettingsPreview(){if(!window.settingsPreview)return;const d={...getDealerSettings(),...Object.fromEntries(new FormData(settingsForm))};settingsPreview.innerHTML=`<div class="mini-head"><img src="${esc(d.logo_url||'../assets/images/logo.png')}"><div><b>${esc(d.business_name)}</b><small>${esc(d.legal_name||'CONTRAT DE VENTE')}</small></div></div><p>${esc(dealerFullAddress(d))}</p><p>${esc(d.phone||'—')} · ${esc(d.email||'—')}</p><div class="mini-legal">${d.neq?'NEQ: '+esc(d.neq)+'<br>':''}${d.gst_number?'TPS: '+esc(d.gst_number)+'<br>':''}${d.qst_number?'TVQ: '+esc(d.qst_number):''}</div><div class="mini-lines"></div><footer>${esc(d.document_footer||[d.business_name,d.phone,d.email].filter(Boolean).join(' · '))}</footer>`}
async function saveCompanySettings(e){e.preventDefault();settingsSaved.textContent='Enregistrement…';const payload=Object.fromEntries(new FormData(settingsForm));for(const n of ['gst_rate','qst_rate','default_admin_fee'])payload[n]=Number(payload[n]||0);delete payload.id;payload.updated_at=new Date().toISOString();const id=settingsForm.elements.id.value;const result=id?await sb.from('company_settings').update(payload).eq('id',id).select().single():await sb.from('company_settings').insert(payload).select().single();if(result.error){settingsSaved.textContent='Erreur: '+result.error.message;return}companySettings=result.data;fillSettingsForm();renderSettingsPreview();settingsSaved.textContent='Paramètres enregistrés dans Supabase.'}

function fullAddress(c){return [c?.address,c?.city,c?.province,c?.postal_code,c?.country].filter(Boolean).join(', ')||'—'}
function documentLabels(lang){return lang==='en'?{title:'SALES CONTRACT',seller:'SELLER',buyer:'BUYER',vehicle:'VEHICLE',details:'TRANSACTION DETAILS',number:'Contract no.',date:'Date',phone:'Phone',email:'Email',address:'Address',license:'Driver licence',vin:'VIN',stock:'Stock no.',year:'Year',make:'Make',model:'Model',trim:'Trim',mileage:'Mileage',price:'Sale price',fees:'Additional fees',discount:'Discount',subtotal:'Subtotal',gst:'GST',qst:'QST',total:'Total',deposit:'Deposit',balance:'Balance due',terms:'TERMS AND ACCEPTANCE',termsText:'The buyer acknowledges having inspected the vehicle, having received the information shown in this contract, and accepting the transaction subject to applicable Québec consumer-protection laws and any written warranty attached to this contract.',buyerSign:'Buyer signature',sellerSign:'Seller signature',draft:'DRAFT — NOT SIGNED'}:{title:'CONTRAT DE VENTE',seller:'VENDEUR',buyer:'ACHETEUR',vehicle:'VÉHICULE',details:'DÉTAILS DE LA TRANSACTION',number:'No de contrat',date:'Date',phone:'Téléphone',email:'Courriel',address:'Adresse',license:'Permis de conduire',vin:'NIV',stock:'No de stock',year:'Année',make:'Marque',model:'Modèle',trim:'Version',mileage:'Kilométrage',price:'Prix de vente',fees:'Frais additionnels',discount:'Rabais',subtotal:'Sous-total',gst:'TPS',qst:'TVQ',total:'Total',deposit:'Dépôt',balance:'Solde dû',terms:'CONDITIONS ET ACCEPTATION',termsText:"L’acheteur reconnaît avoir inspecté le véhicule, avoir reçu les renseignements indiqués au présent contrat et accepter la transaction sous réserve des lois québécoises applicables en matière de protection du consommateur et de toute garantie écrite jointe au contrat.",buyerSign:'Signature de l’acheteur',sellerSign:'Signature du vendeur',draft:'BROUILLON — NON SIGNÉ'}}
function contractDocumentHtml(c){
  const lang=c.language==='en'?'en':'fr',L=documentLabels(lang),d=getDealerSettings(),u=c.customers||{},v=c.vehicles||{};
  const price=Number(c.sale_price||0),fees=Number(c.fees||0),discount=Number(c.discount||0),subtotal=price+fees-discount,gst=Number(c.gst_amount ?? subtotal*Number(c.gst_rate||0)/100),qst=Number(c.qst_amount ?? subtotal*Number(c.qst_rate||0)/100),total=Number(c.total_amount ?? subtotal+gst+qst),deposit=Number(c.deposit||0),balance=Number(c.balance_amount ?? Math.max(0,total-deposit));
  const row=(a,b)=>`<div class="doc-money-row"><span>${a}</span><strong>${money(b)}</strong></div>`;
  return `<header class="doc-header"><img src="${esc(d.logo_url||'../assets/images/logo.png')}" alt="${esc(d.business_name)}"><div><h1>${L.title}</h1><p>${esc(contractTypeName(c.contract_types,lang))}</p></div><div class="doc-number"><b>${L.number}</b><span>${esc(contractNumber(c))}</span><b>${L.date}</b><span>${new Date(c.created_at).toLocaleDateString(lang==='en'?'en-CA':'fr-CA')}</span></div></header>${c.status!=='Signé'?`<div class="draft-banner">${L.draft}</div>`:''}<section class="doc-two"><div class="doc-box"><h2>${L.seller}</h2><strong>${esc(d.business_name)}</strong><p>${esc(dealerFullAddress(d))}</p><p>${L.phone}: ${esc(d.phone)}</p><p>${L.email}: ${esc(d.email)}</p>${d.gst_number?`<p>TPS/GST: ${esc(d.gst_number)}</p>`:''}${d.qst_number?`<p>TVQ/QST: ${esc(d.qst_number)}</p>`:''}${d.neq?`<p>NEQ: ${esc(d.neq)}</p>`:''}${d.saaq_dealer_number?`<p>SAAQ: ${esc(d.saaq_dealer_number)}</p>`:''}</div><div class="doc-box"><h2>${L.buyer}</h2><strong>${esc(customerName(u))}</strong><p>${L.address}: ${esc(fullAddress(u))}</p><p>${L.phone}: ${esc(u.phone||'—')}</p><p>${L.email}: ${esc(u.email||'—')}</p><p>${L.license}: ${esc(u.driver_license||'—')}</p></div></section><section class="doc-box"><h2>${L.vehicle}</h2><div class="doc-grid"><div><span>${L.year}</span><strong>${esc(v.year||'—')}</strong></div><div><span>${L.make}</span><strong>${esc(v.make||'—')}</strong></div><div><span>${L.model}</span><strong>${esc(v.model||'—')}</strong></div><div><span>${L.trim}</span><strong>${esc(v.trim||'—')}</strong></div><div><span>${L.vin}</span><strong>${esc(v.vin||'—')}</strong></div><div><span>${L.stock}</span><strong>${esc(v.stock_number||'—')}</strong></div><div><span>${L.mileage}</span><strong>${km(v.mileage||0)}</strong></div><div><span>Couleur / Color</span><strong>${esc(v.color||'—')}</strong></div></div></section><section class="doc-transaction"><div class="doc-box doc-terms"><h2>${L.terms}</h2><p>${esc((lang==='en'?d.terms_en:d.terms_fr)||L.termsText)}</p>${c.notes?`<div class="doc-notes"><b>Notes</b><p>${esc(c.notes)}</p></div>`:''}</div><div class="doc-box doc-totals"><h2>${L.details}</h2>${row(L.price,price)}${row(L.fees,fees)}${row(L.discount,-discount)}${row(L.subtotal,subtotal)}${row(`${L.gst} (${Number(c.gst_rate||0)} %)`,gst)}${row(`${L.qst} (${Number(c.qst_rate||0)} %)`,qst)}${row(L.total,total)}${row(L.deposit,-deposit)}<div class="doc-money-row doc-balance"><span>${L.balance}</span><strong>${money(balance)}</strong></div></div></section><section class="doc-signatures"><div><span></span><b>${L.buyerSign}</b><small>${esc(customerName(u))}</small></div><div><span></span><b>${L.sellerSign}</b><small>${esc(d.business_name)}</small></div></section><footer class="doc-footer">${esc(d.document_footer||[d.business_name,d.phone,d.email].filter(Boolean).join(' · '))}</footer>`
}
function activeBuilderContract(){return contracts.find(x=>x.id===activeDocumentContractId)}
function renderBuilderChecklist(c){
  if(!c||!window.builderChecklist)return;
  const checks=[
    ['Client',!!c.customers],['Adresse client',!!fullAddress(c.customers||{})],['Téléphone client',!!c.customers?.phone],['Courriel client',!!c.customers?.email],
    ['Véhicule',!!c.vehicles],['VIN',!!c.vehicles?.vin],['Prix de vente',Number(c.sale_price||0)>0],['Informations entreprise',!!getDealerSettings().business_name]
  ];
  builderChecklist.innerHTML=checks.map(([label,ok])=>`<div class="check-item ${ok?'ok':'warn'}">${ok?'✓':'!'} ${esc(label)}</div>`).join('');
}
function refreshContractBuilder(){
  const c=activeBuilderContract();if(!c)return;
  contractDocument.innerHTML=contractDocumentHtml(c);
  contractDocument.classList.remove('builder-refresh');void contractDocument.offsetWidth;contractDocument.classList.add('builder-refresh');
  builderLanguage.value=c.language||'fr';builderStatus.value=c.status||'Brouillon';builderNotes.value=c.notes||'';
  builderContractMeta.innerHTML=`<div><span>Contrat</span><strong>${esc(contractNumber(c))}</strong></div><div><span>Client</span><strong>${esc(contractCustomerName(c))}</strong></div><div><span>Véhicule</span><strong>${esc(contractVehicleName(c))}</strong></div><div><span>VIN</span><strong>${esc(c.vehicles?.vin||'—')}</strong></div><div><span>Total</span><strong>${money(c.total_amount||c.sale_price)}</strong></div>`;
  renderBuilderChecklist(c);
}
window.openContractDocument=id=>{const c=contracts.find(x=>x.id===id);if(!c)return;activeDocumentContractId=id;builderSaveMessage.textContent='';refreshContractBuilder();contractDocumentModal.classList.add('open')};
async function saveBuilderChanges(message='Modifications enregistrées.'){
  const c=activeBuilderContract();if(!c)return false;
  builderSaveMessage.textContent='Enregistrement…';
  const payload={language:builderLanguage.value,status:builderStatus.value,notes:builderNotes.value||null,updated_at:new Date().toISOString()};
  const {data,error}=await sb.from('contracts').update(payload).eq('id',c.id).select('*, customers(*), vehicles(*), contract_types:contract_type(id, code, french_name, english_name)').single();
  if(error){builderSaveMessage.textContent='Erreur: '+error.message;return false}
  const i=contracts.findIndex(x=>x.id===c.id);if(i>=0)contracts[i]=data;
  builderSaveMessage.textContent=message;refreshContractBuilder();renderContracts();return true;
}
function contractEmailData(c){
  const lang=c.language||'fr',u=c.customers||{},subject=lang==='en'?`Sharbo Auto contract ${contractNumber(c)}`:`Contrat Sharbo Auto ${contractNumber(c)}`;
  const body=lang==='en'?`Hello ${customerName(u)},\n\nYour Sharbo Auto sales contract ${contractNumber(c)} is ready.\nVehicle: ${contractVehicleName(c)}\nTotal: ${money(c.total_amount||c.sale_price)}\n\nThank you,\n${getDealerSettings().business_name}`:`Bonjour ${customerName(u)},\n\nVotre contrat de vente Sharbo Auto ${contractNumber(c)} est prêt.\nVéhicule : ${contractVehicleName(c)}\nTotal : ${money(c.total_amount||c.sale_price)}\n\nMerci,\n${getDealerSettings().business_name}`;
  return{to:u.email||'',subject,body};
}

contractForm.addEventListener('submit',async e=>{
  e.preventDefault();
  contractFormMessage.textContent='';
  const fd=new FormData(contractForm);
  if(!fd.get('contract_type')){contractFormMessage.textContent='Choisissez un type de contrat. Si la liste est vide, exécutez le correctif SQL V4.2.';setContractStep(3);return;}
  if(!fd.get('customer_id')||!fd.get('vehicle_id')){contractFormMessage.textContent='Le client et le véhicule sont obligatoires.';return;}
  const id=fd.get('id'),base=Number(fd.get('sale_price')||0)+Number(fd.get('fees')||0)-Number(fd.get('discount')||0),gst=base*Number(fd.get('gst_rate')||0)/100,qst=base*Number(fd.get('qst_rate')||0)/100,total=base+gst+qst,deposit=Number(fd.get('deposit')||0),payload={customer_id:fd.get('customer_id'),vehicle_id:fd.get('vehicle_id'),contract_type:fd.get('contract_type'),language:fd.get('language'),status:fd.get('status'),sale_price:Number(fd.get('sale_price')||0),deposit,fees:Number(fd.get('fees')||0),discount:Number(fd.get('discount')||0),gst_rate:Number(fd.get('gst_rate')||0),qst_rate:Number(fd.get('qst_rate')||0),gst_amount:gst,qst_amount:qst,total_amount:total,balance_amount:Math.max(0,total-deposit),notes:fd.get('notes')||null,updated_at:new Date().toISOString()};
  contractSaveBtn.disabled=true;contractFormMessage.textContent='Enregistrement…';
  try{
    const result=id?await sb.from('contracts').update(payload).eq('id',id).select():await sb.from('contracts').insert(payload).select();
    if(result.error)throw result.error;
    const saved=result.data?.[0];
    if(saved)await ensureSalesFile(saved);
    contractFormMessage.textContent='Contrat et dossier de vente enregistrés.';
    await loadContracts();
    await loadSalesFiles();
    setTimeout(()=>contractModal.classList.remove('open'),450);
  }catch(error){
    console.error('Erreur enregistrement contrat:',error);
    contractFormMessage.textContent='Erreur: '+(error?.message||String(error));
  }finally{contractSaveBtn.disabled=false;}
});

loginForm.addEventListener('submit',async e=>{e.preventDefault();loginError.textContent='';const fd=new FormData(loginForm),{error}=await sb.auth.signInWithPassword({email:fd.get('email'),password:fd.get('password')});if(error)loginError.textContent=error.message;else{loginScreen.classList.add('hidden');await Promise.all([loadVehicles(),loadCustomers(),loadContractTypes(),loadCompanySettings()]);await loadContracts();await loadSalesFiles()}});
logoutBtn.addEventListener('click',async()=>{await sb.auth.signOut();location.reload()});
document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));document.querySelectorAll('.addVehicleBtn').forEach(b=>b.addEventListener('click',()=>openVehicle()));menuToggle.addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));inventorySearch.addEventListener('input',renderInventory);customerSearch.addEventListener('input',renderCustomers);customerTypeFilter.addEventListener('change',renderCustomers);contractSearch.addEventListener('input',renderContracts);contractStatusFilter.addEventListener('change',renderContracts);contractTypeFilter.addEventListener('change',renderContracts);statusFilter.addEventListener('change',renderInventory);inventorySort.addEventListener('change',renderInventory);saveVehicleOrder.addEventListener('click',saveInventoryOrder);globalSearch.addEventListener('input',e=>{inventorySearch.value=e.target.value;showPage('inventory');renderInventory()});financeCalculator.addEventListener('input',calculate);closeVehicleModal.addEventListener('click',()=>vehicleModal.classList.remove('open'));cancelVehicle.addEventListener('click',()=>vehicleModal.classList.remove('open'));importLegacyBtn.addEventListener('click',importLegacy);addCustomerBtn.addEventListener('click',()=>openCustomer());closeCustomerModal.addEventListener('click',()=>customerModal.classList.remove('open'));cancelCustomer.addEventListener('click',()=>customerModal.classList.remove('open'));addContractBtn.addEventListener('click',()=>openContract());closeContractModal.addEventListener('click',()=>contractModal.classList.remove('open'));contractPrevBtn.addEventListener('click',()=>setContractStep(contractStep-1));contractNextBtn.addEventListener('click',()=>{if(contractStep===1&&!contractForm.elements.customer_id.value){contractFormMessage.textContent='Choisissez un client.';return}if(contractStep===2&&!contractForm.elements.vehicle_id.value){contractFormMessage.textContent='Choisissez un véhicule.';return}if(contractStep===3&&!contractForm.elements.contract_type.value){contractFormMessage.textContent='Choisissez un type de contrat. Si la liste est vide, exécutez le correctif SQL V4.2.';return}contractFormMessage.textContent='';setContractStep(contractStep+1)});contractVehicle.addEventListener('change',renderContractVehiclePreview);settingsForm.addEventListener('submit',saveCompanySettings);settingsForm.addEventListener('input',renderSettingsPreview);
closeContractDocument.addEventListener('click',()=>contractDocumentModal.classList.remove('open'));
printContractDocument.addEventListener('click',()=>window.print());
downloadContractDocument.addEventListener('click',()=>window.print());
editContractDocument.addEventListener('click',()=>{const id=activeDocumentContractId;contractDocumentModal.classList.remove('open');if(id)editContract(id)});
saveContractBuilder.addEventListener('click',()=>saveBuilderChanges());
builderLanguage.addEventListener('change',()=>{const c=activeBuilderContract();if(c){c.language=builderLanguage.value;refreshContractBuilder()}});
builderStatus.addEventListener('change',()=>{const c=activeBuilderContract();if(c){c.status=builderStatus.value;refreshContractBuilder()}});
builderNotes.addEventListener('input',()=>{const c=activeBuilderContract();if(c){c.notes=builderNotes.value;contractDocument.innerHTML=contractDocumentHtml(c)}});
markContractSigned.addEventListener('click',async()=>{builderStatus.value='Signé';const c=activeBuilderContract();if(c)c.status='Signé';await saveBuilderChanges('Contrat marqué comme signé.')});
copyContractNumber.addEventListener('click',async()=>{const c=activeBuilderContract();if(!c)return;try{await navigator.clipboard.writeText(contractNumber(c));builderSaveMessage.textContent='Numéro copié.'}catch{builderSaveMessage.textContent=contractNumber(c)}});
emailContractDocument.addEventListener('click',async()=>{
  const c=activeBuilderContract();if(!c)return;const m=contractEmailData(c);
  if(!m.to){builderSaveMessage.textContent='Le client n’a pas de courriel.';return}
  builderSaveMessage.textContent='Envoi en cours…';emailContractDocument.disabled=true;
  try{
    const res=await fetch('/.netlify/functions/send-contract-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:m.to,subject:m.subject,body:m.body,contractNumber:contractNumber(c),customerName:contractCustomerName(c),vehicleName:contractVehicleName(c),total:money(c.total_amount||c.sale_price),company:getDealerSettings()})});
    const out=await res.json().catch(()=>({}));if(!res.ok)throw new Error(out.error||'Échec de l’envoi');
    builderSaveMessage.textContent='Courriel envoyé à '+m.to;
  }catch(err){builderSaveMessage.textContent='Envoi automatique indisponible: '+err.message+' — ouverture de votre application courriel.';setTimeout(()=>{window.location.href=`mailto:${encodeURIComponent(m.to)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`},900)}
  finally{emailContractDocument.disabled=false}
});

let activeSalesFileId=null;
let activeSalesPayments=[];
let activeVehicleExpenses=[];
let activeSalesDocuments=[];
let activeSalesTimeline=[];
let activeSalesSignatures=[];
function activeSalesFile(){return salesFiles.find(x=>x.id===activeSalesFileId)}
function receiptNumber(){return `RC-${new Date().getFullYear()}-${String(Date.now()).slice(-7)}`}
function switchSalesTab(name){
  document.querySelectorAll('.sales-tab').forEach(b=>b.classList.toggle('active',b.dataset.salesTab===name));
  document.querySelectorAll('.sales-tab-panel').forEach(p=>p.classList.remove('active'));
  const map={overview:salesTabOverview,payments:salesTabPayments,expenses:salesTabExpenses,documents:salesTabDocuments,signatures:salesTabSignatures,timeline:salesTabTimeline};if(map[name])map[name].classList.add('active');
}
async function loadSalesFileFinancials(){
  const sf=activeSalesFile();if(!sf)return;
  const [p,e,d,t,s]=await Promise.all([
    sb.from('payments').select('*').eq('sales_file_id',sf.id).order('paid_at',{ascending:false}),
    sb.from('vehicle_expenses').select('*').eq('vehicle_id',sf.vehicle_id).order('expense_date',{ascending:false}),
    sb.from('sales_documents').select('*').eq('sales_file_id',sf.id).order('created_at',{ascending:false}),
    sb.from('sales_timeline').select('*').eq('sales_file_id',sf.id).order('created_at',{ascending:false}),
    sb.from('sales_signatures').select('*').eq('sales_file_id',sf.id).order('signed_at',{ascending:false})
  ]);
  if(p.error)paymentMessage.textContent='Erreur: '+p.error.message;else activeSalesPayments=p.data||[];
  if(e.error)expenseMessage.textContent='Erreur: '+e.error.message;else activeVehicleExpenses=e.data||[];
  if(d.error)documentMessage.textContent='Erreur: '+d.error.message;else activeSalesDocuments=d.data||[];
  if(t.error)console.warn(t.error);else activeSalesTimeline=t.data||[];
  if(s.error)console.warn(s.error);else activeSalesSignatures=s.data||[];
  renderSalesFileDetail();
}
function financialNumbers(sf){
  const c=sf?.contracts||{},v=sf?.vehicles||{};
  const total=Number(c.total_amount||c.sale_price||0),contractDeposit=Number(c.deposit||0);
  const extraPaid=activeSalesPayments.reduce((a,x)=>a+Number(x.amount||0),0),paid=contractDeposit+extraPaid,balance=Math.max(0,total-paid);
  const baseVehicleCost=Number(v.purchase_price||v.cost||0)+Number(v.preparation_cost||0)+Number(v.transport_cost||0)+Number(v.inspection_cost||0)+Number(v.other_cost||0);
  const expenses=activeVehicleExpenses.reduce((a,x)=>a+Number(x.amount||0),0),totalCost=baseVehicleCost+expenses;
  const saleBeforeTax=Number(c.sale_price||0)+Number(c.fees||0)-Number(c.discount||0),profit=saleBeforeTax-totalCost;
  return{total,contractDeposit,extraPaid,paid,balance,baseVehicleCost,expenses,totalCost,saleBeforeTax,profit};
}
function renderSalesFileDetail(){
  const sf=activeSalesFile();if(!sf)return;const c=sf.contracts||{},u=sf.customers||{},v=sf.vehicles||{},n=financialNumbers(sf);
  salesFileModalTitle.textContent=sf.file_number||'Dossier de vente';salesFileSubtitle.textContent=`${customerName(u)} · ${v.title||[v.make,v.model,v.year].filter(Boolean).join(' ')} · ${contractNumber(c)}`;
  salesOverviewStats.innerHTML=`<article><span>Total</span><strong>${money(n.total)}</strong></article><article><span>Payé</span><strong>${money(n.paid)}</strong></article><article><span>Solde</span><strong>${money(n.balance)}</strong></article><article><span>Profit estimé</span><strong class="${n.profit<0?'negative':'positive'}">${money(n.profit)}</strong></article>`;
  salesCustomerCard.innerHTML=`<strong>${esc(customerName(u))}</strong><p>${esc(fullAddress(u))}</p><p>${esc(u.phone||'—')}</p><p>${esc(u.email||'—')}</p>`;
  salesVehicleCard.innerHTML=`<div class="sales-vehicle-mini"><img src="${esc(image(v))}"><div><strong>${esc(v.title||[v.make,v.model,v.year].filter(Boolean).join(' '))}</strong><p>VIN: ${esc(v.vin||'—')}</p><p>${km(v.mileage||0)}</p></div></div>`;
  salesContractCard.innerHTML=`<strong>${esc(contractNumber(c))}</strong><p>Statut: ${esc(c.status||'Brouillon')}</p><p>Total: ${money(n.total)}</p><p>Solde: ${money(n.balance)}</p>`;
  paymentSummary.innerHTML=`<article><span>Total contrat</span><strong>${money(n.total)}</strong></article><article><span>Dépôt au contrat</span><strong>${money(n.contractDeposit)}</strong></article><article><span>Autres paiements</span><strong>${money(n.extraPaid)}</strong></article><article><span>Solde</span><strong>${money(n.balance)}</strong></article>`;
  paymentsBody.innerHTML=activeSalesPayments.map(p=>`<tr><td>${new Date(p.paid_at).toLocaleString('fr-CA')}</td><td>${esc(p.payment_type||'Paiement')}</td><td>${esc(p.payment_method||'—')}</td><td>${esc(p.receipt_number||'—')}</td><td><strong>${money(p.amount)}</strong></td><td><button class="table-btn danger" onclick="deleteSalesPayment('${p.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="6">Aucun paiement additionnel.</td></tr>';
  profitSummary.innerHTML=`<article><span>Prix avant taxes</span><strong>${money(n.saleBeforeTax)}</strong></article><article><span>Coût de base</span><strong>${money(n.baseVehicleCost)}</strong></article><article><span>Dépenses ajoutées</span><strong>${money(n.expenses)}</strong></article><article><span>Profit estimé</span><strong class="${n.profit<0?'negative':'positive'}">${money(n.profit)}</strong></article>`;
  expensesBody.innerHTML=activeVehicleExpenses.map(x=>`<tr><td>${new Date(x.expense_date+'T12:00:00').toLocaleDateString('fr-CA')}</td><td>${esc(x.category||'Autre')}</td><td>${esc(x.supplier||'—')}</td><td>${esc(x.description||'—')}</td><td><strong>${money(x.amount)}</strong></td><td><button class="table-btn danger" onclick="deleteVehicleExpense('${x.id}')">Supprimer</button></td></tr>`).join('')||'<tr><td colspan="6">Aucun coût additionnel.</td></tr>';
  documentsGrid.innerHTML=activeSalesDocuments.map(d=>`<article class="document-card"><div class="document-icon">${d.mime_type?.includes('pdf')?'PDF':'DOC'}</div><div><strong>${esc(d.display_name||d.file_name)}</strong><p>${esc(d.document_type||'Autre')} · ${new Date(d.created_at).toLocaleDateString('fr-CA')}</p></div><div class="document-actions"><a class="table-btn" href="${esc(d.public_url||'#')}" target="_blank">Ouvrir</a><button class="table-btn danger" onclick="deleteSalesDocument('${d.id}','${esc(d.storage_path||'')}')">Supprimer</button></div></article>`).join('')||'<p class="muted">Aucun document.</p>';
  timelineList.innerHTML=activeSalesTimeline.map(x=>`<article class="timeline-item"><span></span><div><strong>${esc(x.title||x.event_type)}</strong><p>${esc(x.description||'')}</p><small>${new Date(x.created_at).toLocaleString('fr-CA')}</small></div></article>`).join('')||'<p class="muted">Aucune activité enregistrée.</p>';
  ['customer','seller'].forEach(role=>{const sig=activeSalesSignatures.find(x=>x.signer_role===role);const el=document.getElementById(role+'SignatureStatus');if(el)el.textContent=sig?'Enregistrée le '+new Date(sig.signed_at).toLocaleString('fr-CA'):'Pas encore signée';});
}
window.openSalesFile=async id=>{activeSalesFileId=id;activeSalesPayments=[];activeVehicleExpenses=[];activeSalesDocuments=[];activeSalesTimeline=[];activeSalesSignatures=[];paymentMessage.textContent='';expenseMessage.textContent='';switchSalesTab('overview');salesFileModal.classList.add('open');renderSalesFileDetail();await loadSalesFileFinancials()};
async function refreshContractBalance(){
 const sf=activeSalesFile();if(!sf)return;const n=financialNumbers(sf),c=sf.contracts||{};
 const {error}=await sb.from('contracts').update({balance_amount:n.balance,updated_at:new Date().toISOString()}).eq('id',c.id);if(!error){c.balance_amount=n.balance;const ci=contracts.findIndex(x=>x.id===c.id);if(ci>=0)contracts[ci].balance_amount=n.balance;}
}
window.deleteSalesPayment=async id=>{if(!confirm('Supprimer ce paiement?'))return;const {error}=await sb.from('payments').delete().eq('id',id);if(error){paymentMessage.textContent='Erreur: '+error.message;return}activeSalesPayments=activeSalesPayments.filter(x=>x.id!==id);await refreshContractBalance();renderSalesFileDetail();await loadSalesFiles()};
window.deleteVehicleExpense=async id=>{if(!confirm('Supprimer ce coût?'))return;const {error}=await sb.from('vehicle_expenses').delete().eq('id',id);if(error){expenseMessage.textContent='Erreur: '+error.message;return}activeVehicleExpenses=activeVehicleExpenses.filter(x=>x.id!==id);renderSalesFileDetail()};


closeSalesFileModal.addEventListener('click',()=>salesFileModal.classList.remove('open'));
document.querySelectorAll('.sales-tab').forEach(b=>b.addEventListener('click',()=>switchSalesTab(b.dataset.salesTab)));
showPaymentForm.addEventListener('click',()=>{paymentForm.classList.remove('hidden');paymentForm.elements.paid_at.value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16)});
cancelPaymentForm.addEventListener('click',()=>paymentForm.classList.add('hidden'));
showExpenseForm.addEventListener('click',()=>{expenseForm.classList.remove('hidden');expenseForm.elements.expense_date.value=new Date().toISOString().slice(0,10)});
cancelExpenseForm.addEventListener('click',()=>expenseForm.classList.add('hidden'));
salesAddPaymentQuick.addEventListener('click',()=>{switchSalesTab('payments');showPaymentForm.click()});
salesAddExpenseQuick.addEventListener('click',()=>{switchSalesTab('expenses');showExpenseForm.click()});
salesOpenContract.addEventListener('click',()=>{const sf=activeSalesFile();if(sf?.contract_id){salesFileModal.classList.remove('open');openContractDocument(sf.contract_id)}});
paymentForm.addEventListener('submit',async e=>{e.preventDefault();const sf=activeSalesFile();if(!sf)return;const fd=new FormData(paymentForm),payload={sales_file_id:sf.id,contract_id:sf.contract_id,payment_type:fd.get('payment_type'),payment_method:fd.get('payment_method'),amount:Number(fd.get('amount')||0),receipt_number:receiptNumber(),paid_at:new Date(fd.get('paid_at')).toISOString(),notes:fd.get('notes')||null};paymentMessage.textContent='Enregistrement…';const {data,error}=await sb.from('payments').insert(payload).select().single();if(error){paymentMessage.textContent='Erreur: '+error.message;return}activeSalesPayments.unshift(data);paymentForm.reset();paymentForm.classList.add('hidden');await refreshContractBalance();renderSalesFileDetail();await loadSalesFiles();paymentMessage.textContent='Paiement enregistré.';await addTimeline('payment','Paiement ajouté',money(payload.amount)+' · '+payload.payment_method)});
expenseForm.addEventListener('submit',async e=>{e.preventDefault();const sf=activeSalesFile();if(!sf)return;const fd=new FormData(expenseForm),payload={vehicle_id:sf.vehicle_id,category:fd.get('category'),supplier:fd.get('supplier')||null,description:fd.get('description')||null,amount:Number(fd.get('amount')||0),expense_date:fd.get('expense_date')};expenseMessage.textContent='Enregistrement…';const {data,error}=await sb.from('vehicle_expenses').insert(payload).select().single();if(error){expenseMessage.textContent='Erreur: '+error.message;return}activeVehicleExpenses.unshift(data);expenseForm.reset();expenseForm.classList.add('hidden');renderSalesFileDetail();expenseMessage.textContent='Coût enregistré.';await addTimeline('expense','Coût ajouté',money(payload.amount)+' · '+payload.category)});


async function addTimeline(event_type,title,description=''){
 const sf=activeSalesFile();if(!sf)return;const {data,error}=await sb.from('sales_timeline').insert({sales_file_id:sf.id,event_type,title,description}).select().single();if(!error){activeSalesTimeline.unshift(data);renderSalesFileDetail();}
}
documentForm.addEventListener('submit',async e=>{e.preventDefault();const sf=activeSalesFile();if(!sf)return;const fd=new FormData(documentForm),file=fd.get('file');if(!file?.size)return;documentMessage.textContent='Téléversement…';const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_'),path=`sales-files/${sf.id}/${Date.now()}-${safe}`;const up=await sb.storage.from('Vehicles').upload(path,file,{upsert:false});if(up.error){documentMessage.textContent='Erreur: '+up.error.message;return}const {data:urlData}=sb.storage.from('Vehicles').getPublicUrl(path);const payload={sales_file_id:sf.id,document_type:fd.get('document_type'),file_name:file.name,display_name:fd.get('display_name')||file.name,mime_type:file.type,size_bytes:file.size,storage_path:path,public_url:urlData.publicUrl};const {data,error}=await sb.from('sales_documents').insert(payload).select().single();if(error){documentMessage.textContent='Erreur: '+error.message;return}activeSalesDocuments.unshift(data);documentForm.reset();documentMessage.textContent='Document ajouté.';await addTimeline('document','Document ajouté',payload.display_name);renderSalesFileDetail();});
window.deleteSalesDocument=async(id,path)=>{if(!confirm('Supprimer ce document?'))return;const {error}=await sb.from('sales_documents').delete().eq('id',id);if(error){documentMessage.textContent='Erreur: '+error.message;return}if(path)await sb.storage.from('Vehicles').remove([path]);activeSalesDocuments=activeSalesDocuments.filter(x=>x.id!==id);await addTimeline('document','Document supprimé','');renderSalesFileDetail();};
function setupSignaturePad(canvas){const ctx=canvas.getContext('2d');ctx.lineWidth=3;ctx.lineCap='round';let drawing=false;const pos=e=>{const r=canvas.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*(canvas.width/r.width),y:(p.clientY-r.top)*(canvas.height/r.height)}};const start=e=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault()};const move=e=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault()};const end=()=>drawing=false;canvas.addEventListener('mousedown',start);canvas.addEventListener('mousemove',move);window.addEventListener('mouseup',end);canvas.addEventListener('touchstart',start,{passive:false});canvas.addEventListener('touchmove',move,{passive:false});canvas.addEventListener('touchend',end);}
['customer','seller'].forEach(role=>setupSignaturePad(document.getElementById(role+'Signature')));
document.querySelectorAll('[data-clear-signature]').forEach(b=>b.addEventListener('click',()=>{const c=document.getElementById(b.dataset.clearSignature+'Signature');c.getContext('2d').clearRect(0,0,c.width,c.height)}));
document.querySelectorAll('[data-save-signature]').forEach(b=>b.addEventListener('click',async()=>{const role=b.dataset.saveSignature,sf=activeSalesFile(),canvas=document.getElementById(role+'Signature');if(!sf)return;signatureMessage.textContent='Enregistrement…';const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));const path=`signatures/${sf.id}/${role}-${Date.now()}.png`;const up=await sb.storage.from('Vehicles').upload(path,blob,{contentType:'image/png'});if(up.error){signatureMessage.textContent='Erreur: '+up.error.message;return}const {data:u}=sb.storage.from('Vehicles').getPublicUrl(path);await sb.from('sales_signatures').delete().eq('sales_file_id',sf.id).eq('signer_role',role);const {data,error}=await sb.from('sales_signatures').insert({sales_file_id:sf.id,contract_id:sf.contract_id,signer_role:role,signature_url:u.publicUrl,storage_path:path,signed_at:new Date().toISOString()}).select().single();if(error){signatureMessage.textContent='Erreur: '+error.message;return}activeSalesSignatures=activeSalesSignatures.filter(x=>x.signer_role!==role);activeSalesSignatures.unshift(data);signatureMessage.textContent='Signature enregistrée.';await addTimeline('signature',role==='customer'?'Signature client':'Signature vendeur','Signature électronique enregistrée');renderSalesFileDetail();}));
finalizeContractBtn.addEventListener('click',async()=>{const sf=activeSalesFile();if(!sf)return;const hasCustomer=activeSalesSignatures.some(x=>x.signer_role==='customer'),hasSeller=activeSalesSignatures.some(x=>x.signer_role==='seller');if(!hasCustomer||!hasSeller){signatureMessage.textContent='Les deux signatures sont requises.';return}const now=new Date().toISOString();const c=await sb.from('contracts').update({status:'Signé',updated_at:now}).eq('id',sf.contract_id);if(c.error){signatureMessage.textContent='Erreur: '+c.error.message;return}await sb.from('sales_files').update({status:'Signé',updated_at:now}).eq('id',sf.id);await sb.from('vehicles').update({status:'Vendu',updated_at:now}).eq('id',sf.vehicle_id);sf.status='Signé';if(sf.contracts)sf.contracts.status='Signé';signatureMessage.textContent='Contrat finalisé et véhicule marqué Vendu.';await addTimeline('status','Contrat finalisé','Statut Signé · véhicule Vendu');renderSalesFiles();renderSalesFileDetail();});
exportSalesCsv.addEventListener('click',()=>{const sf=activeSalesFile();if(!sf)return;const n=financialNumbers(sf),rows=[['Dossier','Client','Véhicule','Total','Payé','Solde','Profit'],[sf.file_number,customerName(sf.customers||{}),(sf.vehicles||{}).title||'',n.total,n.paid,n.balance,n.profit]];const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=(sf.file_number||'dossier')+'.csv';a.click();URL.revokeObjectURL(a.href);});

document.addEventListener('DOMContentLoaded',()=>{fillSettingsForm();renderSettingsPreview();showPage(location.hash.replace('#','')||'dashboard');calculate();requireAuth()});
