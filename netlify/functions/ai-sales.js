exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  if (!process.env.OPENAI_API_KEY) return { statusCode: 503, body: JSON.stringify({error:'OPENAI_API_KEY missing'}) };
  try {
    const {vehicle,type} = JSON.parse(event.body || '{}');
    const prompt = `You are the bilingual sales assistant for Sharbo Auto, a used-car dealer in Laval, Quebec. Generate ${type}. Be accurate, professional, concise, and never invent equipment or condition. For descriptions output exactly FR: then EN:. Vehicle data: ${JSON.stringify(vehicle)}`;
    const r = await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5-mini',input:prompt,max_output_tokens:900})});
    const j=await r.json(); if(!r.ok) throw new Error(j.error?.message||'OpenAI error');
    return {statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify({text:j.output_text||''})};
  } catch(e){ return {statusCode:500,headers:{'Content-Type':'application/json'},body:JSON.stringify({error:e.message})}; }
};
