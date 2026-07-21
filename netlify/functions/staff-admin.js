const json=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const url='https://uezklslirtarcxeyqnyb.supabase.co';
 const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!service)return json(503,{error:'La clé SUPABASE_SERVICE_ROLE_KEY manque dans Netlify.'});
 try{
  const token=(event.headers.authorization||event.headers.Authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)throw new Error('Session manquante.');
  const userRes=await fetch(`${url}/auth/v1/user`,{headers:{apikey:service,Authorization:`Bearer ${token}`}});
  const caller=await userRes.json(); if(!userRes.ok||!caller.id)return json(401,{error:'Session invalide.'});
  const owner=(caller.email||'').toLowerCase()==='hashem@sharboauto.com';
  const roleRes=await fetch(`${url}/rest/v1/staff_profiles?user_id=eq.${caller.id}&select=role,permissions,active`,{headers:{apikey:service,Authorization:`Bearer ${service}`}});
  const roles=await roleRes.json(); const me=roles?.[0];
  const canManage=owner||(me?.active&&((me.role==='admin')||(me.permissions||[]).includes('staff.manage')));
  if(!canManage)return json(403,{error:'Vous n’avez pas la permission de gérer les employés.'});
  const {action,staff={}}=JSON.parse(event.body||'{}');
  if(!['create','update'].includes(action))return json(400,{error:'Action invalide.'});
  if(!staff.email||!staff.full_name)return json(400,{error:'Nom et courriel requis.'});
  let uid=staff.user_id;
  if(action==='create'){
    const password=String(staff.temporary_password||'');
    if(password.length<10)throw new Error('Le mot de passe temporaire doit contenir au moins 10 caractères.');
    const createdRes=await fetch(`${url}/auth/v1/admin/users`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify({email:staff.email,password,email_confirm:true,user_metadata:{full_name:staff.full_name,must_change_password:true}})});
    const created=await createdRes.json();
    if(!createdRes.ok)throw new Error(created.msg||created.message||'Création du compte impossible.');
    uid=created.id;
  }
  if(!uid)throw new Error('Utilisateur introuvable.');
  if((staff.email||'').toLowerCase()==='hashem@sharboauto.com' && (!staff.active||staff.role!=='admin'))throw new Error('Le compte propriétaire ne peut pas être suspendu ou rétrogradé.');
  const row={user_id:uid,email:staff.email.toLowerCase(),full_name:staff.full_name,phone:staff.phone||null,role:staff.role||'read_only',permissions:Array.isArray(staff.permissions)?staff.permissions:[],active:staff.active!==false,invited_by:caller.id,updated_at:new Date().toISOString()};
  const save=await fetch(`${url}/rest/v1/staff_profiles?on_conflict=user_id`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
  const saved=await save.json(); if(!save.ok)throw new Error(saved.message||'Enregistrement impossible.');
  return json(200,{ok:true,staff:saved[0],temporary_password:action==='create'?staff.temporary_password:undefined});
 }catch(e){return json(400,{error:e.message||'Erreur inconnue.'})}
};
