// Vercel Serverless Function: Proxies chat requests to LiteLLM
// This keeps the API key hidden from the client.
import mahimaKnowledge from '../data/mahima-knowledge.json' with { type: 'json' };

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

  const knowledgeJson = JSON.stringify(mahimaKnowledge, null, 2);

  // System prompt providing context about Mahima's portfolio (includes resume content)
  const systemMessage = {
    role: 'system',
    content: `You are Mahima's Portfolio Assistant — a friendly, knowledgeable AI helper embedded in Mahima Gupta's design portfolio website.

Use this structured knowledge base as the source of truth. Do not invent details outside it:
${knowledgeJson}

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

RECRUITER-FACING POSITIONING:
- Present Mahima as a senior product/UI/UX designer who can translate complex AI, robotics, kiosk, SaaS, and voice workflows into clear user experiences.
- Emphasize business impact where useful: faster handoff, adoption, satisfaction, conversion, retention, and reduced check-in/order friction.
- For hiring questions, connect her strengths to role needs: systems thinking, Figma design systems, user research, prototyping, accessibility, stakeholder collaboration, and developer handoff.
- When a question asks for fit, use confident but grounded language, such as "She would be a strong fit for..." or "Her edge is..."
- Avoid sounding like a resume dump. Lead with the strongest answer, then support it with 1-2 proof points.
- If the user asks for contact, mention the contact form or mahimagupta015@gmail.com.
- If the user's message includes "Attached document context", use that document only for the current answer. Make it clear when you are using the attached document, and do not treat it as permanent portfolio/resume truth unless it matches the knowledge base.

STYLE:
- Professional, polished, warm, and recruiter-friendly.
- 2-4 crisp sentences by default. Use bullets only if the user asks for a list or comparison.
- Make answers specific and attractive, but do not invent employers, metrics, dates, tools, or awards beyond the provided context.
- Return plain text only. Do not use Markdown formatting such as **bold**, headings, tables, or bullet symbols unless the user explicitly asks.
- Answer directly. Do not include hidden reasoning, analysis notes, chain-of-thought, "Okay", "Let me", or <think> blocks in your response.
- End hiring/collaboration answers with a soft next step when natural: "The fastest next step is to contact her through the form or email."`
  };

  const fullMessages = [systemMessage, ...messages];
  const latestUserMessage = [...messages].reverse().find((message) => message?.role === 'user')?.content || '';
  const contactActions = [
    {
      type: 'email',
      label: 'Email Mahima',
      href: 'mailto:mahimagupta015@gmail.com?subject=Portfolio%20Inquiry%20for%20Mahima%20Gupta'
    },
    {
      type: 'call',
      label: 'Call Mahima',
      href: 'tel:+917982908054'
    },
    {
      type: 'linkedin',
      label: 'Open LinkedIn',
      href: 'https://linkedin.com/in/mahima003'
    }
  ];

  const getEmailDraftContext = (question) => {
    const normalized = String(question || '').trim();
    const match =
      normalized.match(/\b(?:recruiting|hiring)\s+for\s+(?:a|an|the)?\s*([^.!?\n]{3,90})/i) ||
      normalized.match(/\b(?:for|role|position)\s+(?:a|an|the)?\s*([^.!?\n]{3,90})/i) ||
      normalized.match(/\b(?:about|regarding)\s+([^.!?\n]{3,90})/i);
    const rawRole = match?.[1]
      ?.replace(/\b(email|mail|draft|format|subject|body|to|mahima)\b/gi, '')
      .replace(/^(?:for|a|an|the)\s+/i, '')
      .trim();
    const role = rawRole || 'a product/UI/UX design opportunity';
    const bodyRole = /\b(role|position|opportunity)\b/i.test(role) ? `the ${role}` : `the ${role} opportunity`;
    const subject = `Opportunity for Mahima Gupta - ${role}`;
    const body = [
      'Hi Mahima,',
      '',
      `I came across your portfolio and would like to connect regarding ${bodyRole}. Your experience across AI interfaces, robotics workflows, kiosks, SaaS dashboards, and voice-led product design looks relevant to what we are hiring for.`,
      '',
      'Could we schedule a short conversation to discuss the role, timeline, and fit?',
      '',
      'Best,',
      '[Your Name]'
    ].join('\n');

    return { role, subject, body };
  };

  const buildEmailDraftReply = (question) => {
    const { subject, body } = getEmailDraftContext(question);
    return `Subject: ${subject}\n\nBody:\n${body}`;
  };

  const buildEmailDraftAction = (question) => {
    const { subject, body } = getEmailDraftContext(question);
    return {
      type: 'email',
      label: 'Open Email Draft',
      href: `mailto:mahimagupta015@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    };
  };

  const cleanAssistantText = (text) => {
    return String(text || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^[\s\S]*?<\/think>/i, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*\n]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*•]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const recruiterFallback = (question) => {
    const normalized = question.toLowerCase();
    const hasContactIntent = /\b(call|phone|email|mail|contact|reach|linkedin|interview)\b/.test(normalized);
    const hasEmailDraftIntent = /\b(write|draft|generate|create|format|compose)\b/.test(normalized) && /\b(email|mail|subject|body)\b/.test(normalized);
    const hasAiIntent = /\b(ai|voice|robot|robotics|vui)\b/.test(normalized);

    if (hasEmailDraftIntent) {
      return buildEmailDraftReply(question);
    }

    if (hasContactIntent) {
      return 'You can contact Mahima directly for hiring or interview conversations. Use email for role details and timelines, call for quick coordination, or open LinkedIn to review her profile first.';
    }

    if (normalized.includes('hire') || normalized.includes('fit')) {
      return 'Mahima would be a strong fit for teams building AI, SaaS, kiosk, robotics, or voice-led products because she combines product thinking with polished UI execution. Her work shows practical impact across adoption, satisfaction, conversion, and handoff efficiency, with strong Figma systems, prototyping, and cross-functional collaboration behind it.';
    }

    if (hasAiIntent) {
      return 'Mahima has hands-on experience designing AI-powered kiosks, robotics interfaces, enterprise dashboards, and multimodal voice/chat experiences. Her edge is making technically complex workflows feel clear, approachable, and usable for real customers in hospitality, healthcare, retail, and enterprise contexts.';
    }

    if (normalized.includes('impact') || normalized.includes('project') || normalized.includes('business')) {
      return 'Her portfolio connects design decisions to measurable outcomes: 78% adoption and faster ordering for HeyAlpha Food Voice, 92% usability and reduced check-in time for Patient Voice Helper, and a 45% conversion uplift for an Agentic AI landing page. That makes her work useful for recruiters looking for both visual craft and product impact.';
    }

    if (normalized.includes('skill') || normalized.includes('figma') || normalized.includes('tool')) {
      return 'Mahima brings strong UI/UX fundamentals across research, flows, wireframes, high-fidelity UI, prototyping, accessibility, and design systems. She is especially strong in Figma, responsive components, developer handoff, and designing for AI, VUI, kiosks, SaaS dashboards, and enterprise workflows.';
    }
    return 'Mahima is a senior UI/UX and product designer focused on AI interfaces, robotics workflows, SaaS dashboards, voice experiences, and self-service kiosks. She combines user research, polished visual design, prototyping, and scalable Figma systems to turn complex product ideas into clear, recruiter-ready digital experiences.';
  };

  const attachedDocumentFallback = (question) => {
    const documentText = String(question || '').split('Attached document context for answering this question:')[1] || '';
    const compactText = documentText.replace(/\s+/g, ' ').trim();
    const roleMatch =
      compactText.match(/\b(?:for|about)\s+(?:a|an|the)?\s*([^.!?]{3,90}?\brole\b)/i) ||
      compactText.match(/\b([^.!?]{3,90}?\b(?:designer|developer|manager|researcher|strategist)\b[^.!?]{0,40})/i);
    const role = roleMatch?.[1]?.trim() || 'the opportunity described in the attached document';

    return `The attached document is about ${role}. Based on the document, the focus is on the requirements and context in that brief; Mahima's portfolio is especially relevant where the role needs AI interface design, kiosk UX, robotics workflows, SaaS dashboards, or clear product experiences for complex systems.`;
  };

  const shouldUseRecruiterFallback = (question) => {
    const normalized = question.toLowerCase();
    const hasAttachedDocumentContext = normalized.includes('attached document context');
    const hasEmailDraftIntent = /\b(write|draft|generate|create|format|compose)\b/.test(normalized) && /\b(email|mail|subject|body)\b/.test(normalized);
    const hasContactIntent = /\b(call|phone|email|mail|contact|reach|linkedin|interview)\b/.test(normalized);

    if (hasAttachedDocumentContext && !hasEmailDraftIntent && !hasContactIntent) {
      return false;
    }

    return (
      hasEmailDraftIntent ||
      normalized.includes('hire') ||
      normalized.includes('fit') ||
      /\b(ai|voice|robot|robotics|vui)\b/.test(normalized) ||
      normalized.includes('impact') ||
      normalized.includes('business') ||
      normalized.includes('skill') ||
      normalized.includes('figma') ||
      hasContactIntent
    );
  };

  const shouldOfferContactActions = (question) => {
    const normalized = question.toLowerCase();
    return /\b(call|phone|email|mail|contact|reach|linkedin|interview)\b/.test(normalized);
  };

  const shouldOfferEmailDraft = (question) => {
    const normalized = question.toLowerCase();
    return /\b(write|draft|generate|create|format|compose)\b/.test(normalized) && /\b(email|mail|subject|body)\b/.test(normalized);
  };

  const getActions = (question) => {
    if (shouldOfferEmailDraft(question)) {
      return [buildEmailDraftAction(question), ...contactActions.filter((action) => action.type !== 'email')];
    }
    return shouldOfferContactActions(question) ? contactActions : [];
  };

  if (shouldUseRecruiterFallback(latestUserMessage)) {
    return res.status(200).json({
      reply: recruiterFallback(latestUserMessage),
      actions: getActions(latestUserMessage)
    });
  }

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
        max_tokens: 560,
        temperature: 0.55
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('LiteLLM API error:', response.status, errorBody);
      return res.status(502).json({ error: 'Failed to get response from AI service.' });
    }

    const data = await response.json();
    const rawAssistantMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    let assistantMessage = cleanAssistantText(rawAssistantMessage);

    const hasReasoningLead = /^(okay|let me|i need to|i should|the user|from the|so,)/i.test(assistantMessage);

    if (hasReasoningLead) {
      const quotedAnswers = [...assistantMessage.matchAll(/["“]([^"”]{35,500})["”]/g)]
        .map((match) => match[1].trim())
        .filter((text) => !/^in one sentence/i.test(text) && !/^what does/i.test(text));

      if (quotedAnswers.length) {
        assistantMessage = cleanAssistantText(quotedAnswers[quotedAnswers.length - 1]);
      } else {
        const paragraphs = assistantMessage
          .split(/\n{2,}/)
          .map((text) => text.trim())
          .filter(Boolean);
        assistantMessage = cleanAssistantText(paragraphs[paragraphs.length - 1] || assistantMessage);
      }
    }

    const hasAttachedDocumentContext = latestUserMessage.toLowerCase().includes('attached document context');
    const hasBadAnswerShape =
      /^(okay|let me|i need to|i should|the user|from the|so,)/i.test(assistantMessage) ||
      /reasoning|structure the answer|provided context|provided resume/i.test(assistantMessage) ||
      assistantMessage.length < 90 ||
      (hasAttachedDocumentContext && !/[.!?]$/.test(assistantMessage)) ||
      /[:*-]\s*$/.test(assistantMessage);
    const shouldCleanWithFallback = !hasAttachedDocumentContext && hasBadAnswerShape;

    if (hasAttachedDocumentContext && hasBadAnswerShape) {
      assistantMessage = attachedDocumentFallback(latestUserMessage);
    } else if (shouldCleanWithFallback) {
      assistantMessage = recruiterFallback(latestUserMessage);
    }

    assistantMessage = assistantMessage || 'Sorry, I could not generate a response.';

    return res.status(200).json({
      reply: assistantMessage,
      actions: getActions(latestUserMessage)
    });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error while contacting AI service.' });
  }
}
