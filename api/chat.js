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
  const model = process.env.LITELLM_MODEL || 'nvidia.nemotron-nano-9b-v2';

  if (!apiKey) {
    return res.status(500).json({ error: 'LiteLLM API key not configured on the server.' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing or invalid "messages" array in request body.' });
  }

  // System prompt providing context about Mahima's portfolio (includes resume content)
  const systemMessage = {
    role: 'system',
    content: `You are Mahima's Portfolio Assistant — a friendly, knowledgeable AI helper embedded in Mahima Gupta's design portfolio website.

ABOUT MAHIMA GUPTA (from resume):
- Name: Mahima Gupta
- Title: Senior UI/UX Designer | Product Designer | Visual Designer
- Contact: +91-7982908054, mahimagupta015@gmail.com
- LinkedIn: linkedin.com/in/mahima003
- Behance: behance.net/mahima-gupta

SUMMARY:
UI/UX Designer with 3+ years of experience designing user-centered digital products for AI-driven platforms, robotics, enterprise SaaS, and dashboards. Skilled in user research, wireframing, prototyping, interaction design, and usability testing, with proficiency in Figma, Framer, and modern AI design tools. Experienced in design systems, high-fidelity interfaces, conversational AI, voice UI, and self-service kiosks.

TECHNICAL SKILLS:
- Design Tools: Figma (Auto Layout, Components, Responsive Design), Framer, Adobe XD, Sketch, Stitch AI, Loveable AI, Miro, FigJam, Zeplin, Adobe Illustrator, Adobe Photoshop, Canva
- Core Competencies: User Research, User Personas, User Flows, Wireframing, Rapid Prototyping, Interaction Design (IxD), Usability Testing, Information Architecture, Visual Design, Design Systems, Responsive Design, Accessibility (WCAG 2.1)
- Domain Knowledge: Conversational AI (VUI), Voice Interfaces, Self-Service Kiosk Design, SaaS Dashboards, AI-Driven Products, Robotics Interfaces, Gamification, B2B Enterprise Applications

EXPERIENCE:

1. Alphadroid (Jun 2024 – Present) - Senior UI/UX Designer, Noida, India:
   - Leading UI/UX design for AI-powered kiosks, robotics platforms, and enterprise dashboards
   - Architected HeyAlpha, a multimodal conversational AI interface (voice/chat) for touchless experiences
   - Developed a Scalable Design System in Figma, reducing handoff time by 25%
   - Designed customer-facing experiences for Bikanervala, Green Park Hotels, Moxy Hotels (Marriott), Dabur, India Gate Basmati
   - Created gamified experiences and AI-powered engagement workflows

2. Gamemano (Nov 2022 – May 2024) - UI/UX Designer, Noida, India:
   - Visual design of Slot Game Interfaces, reels, HUD elements, in-game menus
   - Created interactive prototypes and user journey mapping
   - Collaborated with Unity developers for pixel-perfect asset integration

3. 5bix.ca (Sep 2022 – Nov 2022) - UI/UX Designer (Hybrid), Remote:
   - Developed wireframes and low-fidelity prototypes
   - Created custom icon sets and visual assets

CERTIFICATIONS:
- UX Design Job Simulation | Lloyds Banking Group (Forage) - Jan 2026
- Google UX Design Professional Certificate | Coursera - Mar 2022 (200+ hours)
- Microsoft Fundamentals UI/UX Design Certificate - 2025

EDUCATION:
- Bachelor of Arts (BA) - Uttar Pradesh Rajarshi Tandon Open University (2018-2021)

FEATURED PROJECTS (in portfolio):
1. In-Room Companion — QR Concierge with 3D Talking Avatar for Aliste Hotel. 95% guest satisfaction.
2. HeyAlpha Food Voice — Touchless restaurant ordering via voice for Marriott Moxy & Bikanervala. 78% guest adoption, 3x faster orders.
3. Agentic AI Landing Page — Futuristic corporate web for Alphadroid's robotics AI. 45% conversion uplift.
4. Patient Voice Helper — Hospital wayfinding & appointment kiosk for Novacare Hospital. 92% usability rating, 40% check-in time reduction.
5. Get Ready in 3 Seconds — Rapid self-checkout kiosk for retail IoT. 85% satisfaction, 3-second checkout.
6. AlphaDiz — Online gaming & community hub for Gamemano. 28% retention uplift.

YOUR BEHAVIOR:
- Be warm, professional, and concise.
- Answer questions about Mahima's work, skills, experience, and projects.
- If asked about hiring or collaboration, encourage them to use the contact form or email.
- If asked something unrelated to Mahima or design, politely redirect.
- Keep responses brief (2-4 sentences max) unless a detailed answer is specifically requested.
- Answer directly. Do not include hidden reasoning, analysis notes, chain-of-thought, or <think> blocks in your response.`
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
    const rawAssistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    let assistantMessage = rawAssistantMessage
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/i, '')
      .trim();

    if (/^(okay|let me|i need to|the user|from the|so,)/i.test(assistantMessage)) {
      const quotedAnswers = [...assistantMessage.matchAll(/["“]([^"”]{35,500})["”]/g)]
        .map((match) => match[1].trim())
        .filter((text) => !/^in one sentence/i.test(text) && !/^what does/i.test(text));

      if (quotedAnswers.length) {
        assistantMessage = quotedAnswers[quotedAnswers.length - 1];
      }
    }

    assistantMessage = assistantMessage || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply: assistantMessage });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error while contacting AI service.' });
  }
}
