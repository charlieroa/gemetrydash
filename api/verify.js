// Función serverless de Vercel: verifica la foto de la misión de papel
// usando la API de OpenAI (GPT-4o con visión). La key vive en la variable
// de entorno OPENAI_API_KEY (Vercel → Settings → Environment Variables).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta OPENAI_API_KEY en las variables de entorno de Vercel' });
  }

  const { image, mediaType, prompt } = req.body || {};
  if (!image || !prompt) {
    return res.status(400).json({ error: 'Faltan campos: image y prompt son requeridos' });
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${mediaType || 'image/jpeg'};base64,${image}`, detail: 'high' },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: data.error?.message || 'Error de OpenAI' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: 'Error de conexión con OpenAI' });
  }
}
