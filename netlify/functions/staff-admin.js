const json=(code,body)=>({statusCode:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body)});
exports.handler=async(event)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed'});
 const url=process.env.SUPABASE_URL, service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!service)return json(503,{error:'Ajoutez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans Netlify.'});
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
  if(!['invite','update'].includes(action))return json(400,{error:'Action invalide.'});
  if(!staff.email||!staff.full_name)return json(400,{error:'Nom et courriel requis.'});
  let uid=staff.user_id;
  if(action==='invite'){
    const invite=await fetch(`${url}/auth/v1/invite`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'},body:JSON.stringify({email:staff.email,data:{full_name:staff.full_name},redirect_to:`${event.headers.origin||''}/admin-v2/`})});
    const invited=await invite.json(); if(!invite.ok){
      if(!String(invited.msg||invited.message||'').toLowerCase().includes('already'))throw new Error(invited.msg||invited.message||'Invitation impossible.');
      const users=await fetch(`${url}/auth/v1/admin/users?per_page=1000`,{headers:{apikey:service,Authorization:`Bearer ${service}`}}).then(r=>r.json());
      uid=(users.users||[]).find(u=>(u.email||'').toLowerCase()===staff.email.toLowerCase())?.id;
    } else uid=invited.id;
  }
  if(!uid)throw new Error('Utilisateur introuvable.');
  if((staff.email||'').toLowerCase()==='hashem@sharboauto.com' && (!staff.active||staff.role!=='admin'))throw new Error('Le compte propriétaire ne peut pas être suspendu ou rétrogradé.');
  const row={user_id:uid,email:staff.email.toLowerCase(),full_name:staff.full_name,phone:staff.phone||null,role:staff.role||'read_only',permissions:Array.isArray(staff.permissions)?staff.permissions:[],active:staff.active!==false,invited_by:caller.id,updated_at:new Date().toISOString()};
  const save=await fetch(`${url}/rest/v1/staff_profiles?on_conflict=user_id`,{method:'POST',headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
  const saved=await save.json(); if(!save.ok)throw new Error(saved.message||'Enregistrement impossible.');
  return json(200,{ok:true,staff:saved[0]});
 }catch(e){return json(400,{error:e.message||'Erreur inconnue.'})}
};
