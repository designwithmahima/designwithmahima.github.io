# Astra Agentic Dashboard — Vite + React

Astra keeps the original dark dashboard design while using React for rendering, Vite for development/building, and Express for the secure server-side AI proxy.

## What changed

- Migrated the page entry to React + Vite without redesigning the existing Astra UI.
- Added a restrained half-corona hero treatment inspired by the supplied solar-limb reference.
- Fixed the Ask Astra modal so only the chat history scrolls.
- Removed CSS declarations flagged by Edge Tools: `overscroll-behavior`, `scrollbar-gutter`, `-webkit-overflow-scrolling`, and `mask-image`.
- Kept prefixed and unprefixed `backdrop-filter` declarations together.
- Replaced `concurrently` with a small Node development runner, removing the `util._extend` deprecation warning.
- Vite now uses `strictPort: false`: if 5174 is occupied it automatically starts on 5175, 5176, and so on.
- The development API uses port 8787 and Vite proxies `/api` to it.

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and add server-side LiteLLM settings. Do not expose these values in client code or commit them:

```env
LITELLM_API_KEY=your_server_side_key
LITELLM_API_BASE=https://your-litellm-gateway.example
LITELLM_MODEL=your_model_name
```

## Development

```powershell
npm run dev
```

The terminal prints the actual Vite URL. The preferred URL is `http://localhost:5174`; when that port is busy, Vite automatically chooses the next available port. The API runs internally on `http://localhost:8787`.

Do not run `vite` alone, because Ask Astra requires the Express API process.

## Vercel

The Vercel deployment uses serverless functions in `api/` for `/api/chat` and `/api/health`.
Configure these Production environment variables in Vercel:

- `LITELLM_API_KEY`
- `LITELLM_API_BASE`
- `LITELLM_MODEL`

## Production

```powershell
npm run build
npm start
```

Open `http://localhost:5173`.

## Existing project cleanup

If replacing an older folder, delete obsolete root-level `styles.css` and `script.js` files. This version uses:

- `assets/styles/styles.css`
- `src/legacy.js`
- `src/App.jsx`
- `src/main.jsx`

Old unused root files may continue to appear in VS Code diagnostics even though the application no longer loads them.
