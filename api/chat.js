// Vercel Serverless Function: Proxies chat requests to LiteLLM
// This keeps the API key hidden from the client.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // CORS headers for the Vercel-hosted frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.LITELLM_API_KEY;
  const apiBase = process.env.LITELLM_API_BASE || 'http://13.126.102.204:4000';
  const model = process.env.LITELLM_MODEL || 'deepseek.v3.2';

  if (!apiKey) {
    return res.status(500).json({ error: 'LiteLLM API key not configured on the server.' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid "messages" array in request body.' });
  }

  // System prompt providing context about Mahima's portfolio
  const systemMessage = {
    role: 'system',
    content: `You are Mahima's Portfolio Assistant — a friendly, knowledgeable AI helper embedded in Mahima Gupta's design portfolio website.

About Mahima Gupta:
- Senior UI/UX Designer based in India with 5+ years of experience.
- Specializes in AI interfaces, voice UI (VUI), conversational AI, robotics, IoT, and enterprise SaaS dashboards.
- Proficient with Figma (design systems, auto-layout, variants), prototyping, user research, and interaction design.
- Has designed for brands like Marriott Moxy, Bikanervala, Green Park Hotels, Dabur, and India Gate Basmati.

Featured Projects (in portfolio order):
1. In-Room Companion — QR Concierge with 3D Talking Avatar for Aliste Hotel. 95% guest satisfaction. Multimodal voice + visual room companion.
2. HeyAlpha Food Voice — Touchless restaurant ordering via voice for Marriott Moxy & Bikanervala. 78% guest adoption, 3x faster orders.
3. Agentic AI Landing Page — Futuristic corporate web landing page for Alphadroid's robotics AI solutions. 45% conversion uplift.
4. Patient Voice Helper — Hospital wayfinding & appointment kiosk for Novacare Hospital. 92% usability rating, 40% check-in time reduction.
5. Try Me (Get Ready in 3 Seconds) — Rapid self-checkout kiosk for retail IoT. 85% satisfaction, 3-second checkout time.
6. AlphaDiz — Online gaming & community hub for Gamemano. 28% retention uplift.

Contact Information:
- Email: mahimagupta015@gmail.com
- LinkedIn: linkedin.com/in/mahima003
- Behance: behance.net/mahima-gupta
- Resume is available for download on the portfolio site.

Your behavior:
- Be warm, professional, and concise.
- Answer questions about Mahima's work, skills, experience, and projects.
- If asked about hiring or collaboration, encourage them to use the contact form or email.
- If asked something unrelated to Mahima or design, politely redirect.
- Keep responses brief (2-4 sentences max) unless a detailed answer is specifically requested.`
  };

  const fullMessages = [systemMessage, ...messages];

  try {
    const response = await fetch(`${apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: fullMessages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LiteLLM API error:', response.status, errorBody);
      return res.status(502).json({ error: 'Failed to get response from AI service.' });
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply: assistantMessage });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error while contacting AI service.' });
  }
}
