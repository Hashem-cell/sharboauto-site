exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non permise' }) };
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { statusCode: 503, body: JSON.stringify({ error: 'RESEND_API_KEY non configurée dans Netlify' }) };
    const data = JSON.parse(event.body || '{}');
    if (!data.to) return { statusCode: 400, body: JSON.stringify({ error: 'Courriel du client manquant' }) };
    const company = data.company || {};
    const from = process.env.CONTRACT_FROM_EMAIL || 'Sharbo Auto <onboarding@resend.dev>';
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#202020"><div style="max-width:680px;margin:auto;border:1px solid #ddd;padding:28px"><h2 style="color:#d71920">${escapeHtml(company.business_name || 'Sharbo Auto')}</h2><p>Bonjour ${escapeHtml(data.customerName || '')},</p><p>Votre contrat de vente est prêt.</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #eee">Contrat</td><td style="padding:8px;border-bottom:1px solid #eee"><b>${escapeHtml(data.contractNumber || '')}</b></td></tr><tr><td style="padding:8px;border-bottom:1px solid #eee">Véhicule</td><td style="padding:8px;border-bottom:1px solid #eee"><b>${escapeHtml(data.vehicleName || '')}</b></td></tr><tr><td style="padding:8px">Total</td><td style="padding:8px"><b>${escapeHtml(data.total || '')}</b></td></tr></table><p style="margin-top:24px;white-space:pre-line">${escapeHtml(data.body || '')}</p><hr><small>${escapeHtml(company.phone || '')} · ${escapeHtml(company.email || '')} · ${escapeHtml(company.website || '')}</small></div></body></html>`;
    const response = await fetch('https://api.resend.com/emails', {method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[data.to],subject:data.subject||'Contrat Sharbo Auto',html})});
    const result = await response.json();
    if (!response.ok) return { statusCode: response.status, body: JSON.stringify({ error: result.message || 'Erreur Resend' }) };
    return { statusCode: 200, body: JSON.stringify({ ok:true, id:result.id }) };
  } catch (error) { return { statusCode: 500, body: JSON.stringify({ error:error.message }) }; }
};
function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
