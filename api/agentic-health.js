export default function handler(_req, res) {
  const baseURL = (process.env.LITELLM_API_BASE || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
  const model = process.env.LITELLM_MODEL || process.env.OPENAI_MODEL || '';
  const configured = Boolean((process.env.LITELLM_API_KEY || process.env.OPENAI_API_KEY || '').trim());

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    configured: configured && Boolean(baseURL && model)
  });
}
