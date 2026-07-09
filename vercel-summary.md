# Vercel Deployment Summary

This file contains the configuration and deployment details for the portfolio project.

## Deployment Details

* **Project Name:** `designwithmahima`
* **Production Domain:** [https://designwithmahima.vercel.app](https://designwithmahima.vercel.app)


---

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `LITELLM_API_KEY` | API key for LiteLLM/OpenAI-compatible API |
| `LITELLM_API_BASE` | API base URL (default: `http://13.126.102.204:4000`) |
| `LITELLM_MODEL` | Model name (default: `nvidia.nemotron-nano-9b-v2`) |

To set via Vercel CLI:
```bash
vercel env add LITELLM_API_KEY
# Paste the key when prompted

vercel env add LITELLM_API_BASE
# Enter: http://13.126.102.204:4000

vercel env add LITELLM_MODEL
# Enter: nvidia.nemotron-nano-9b-v2
```

---

## Quick Reference Commands

Run these commands inside the `designwithmahima.github.io` directory:

### 1. Deploy Updates
To deploy new changes to production:
```bash
vercel --prod
```

### 2. Preview Deployment
To create a preview deployment before publishing to production:
```bash
vercel
```

### 3. Check Logs
To check the runtime/build logs of your project:
```bash
vercel logs designwithmahima
```

### 4. Project Information
To inspect the Vercel project details:
```bash
vercel project inspect designwithmahima
```
