/* chatbot.js — Premium floating chatbot widget for Mahima's Portfolio
 * Only activates on Vercel or localhost (never on GitHub Pages).
 * API key is kept server-side via /api/chat endpoint.
 */

(function () {
  'use strict';

  // ── Gate: only run on Vercel or local dev ──────────────────────────
  const hostname = window.location.hostname;
  const isVercel = hostname.endsWith('.vercel.app') || hostname.endsWith('.vercel.sh');
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';

  // Chatbot disabled on GitHub Pages (no server-side env vars available)
  if (!isVercel && !isLocalDev) return;

  // ── State ──────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let audioCtx = null;
  let soundEnabled = true;
  let activeTypeTimer = null;
  const chatHistory = []; // { role, content }
  const recruiterPrompts = [
    'Why should we hire Mahima?',
    'Summarize her AI UX experience',
    'Which projects show business impact?'
  ];

  // ── DOM scaffold ───────────────────────────────────────────────────
  const root = document.getElementById('chatbot-root');
  if (!root) return;

  root.innerHTML = `
    <button class="cb-fab" id="cb-fab" aria-label="Open chat assistant" title="Ask Mahima's AI Assistant">
      <svg class="cb-fab-icon cb-fab-icon--chat" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      <svg class="cb-fab-icon cb-fab-icon--close" xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
    <div class="cb-window" id="cb-window" role="dialog" aria-modal="false" aria-label="Chat with Mahima's assistant">
      <div class="cb-header">
        <div class="cb-header-info">
          <div class="cb-header-avatar">M</div>
          <div>
            <div class="cb-header-title">Mahima AI Concierge</div>
            <div class="cb-header-sub">Recruiter-ready portfolio answers</div>
          </div>
        </div>
        <div class="cb-header-actions">
          <button class="cb-sound-toggle" id="cb-sound" type="button" aria-label="Toggle chat sounds" title="Toggle sounds">
            <span class="cb-sound-on">♪</span>
            <span class="cb-sound-off">×</span>
          </button>
          <button class="cb-header-close" id="cb-close" aria-label="Close chat">&times;</button>
        </div>
      </div>
      <div class="cb-messages" id="cb-messages">
        <div class="cb-msg cb-msg--assistant">
          <div class="cb-msg-bubble">Hi, I can help you evaluate Mahima for product, UI/UX, AI interface, kiosk, and SaaS design roles. Try a recruiter-style question below.</div>
        </div>
      </div>
      <div class="cb-suggestions" id="cb-suggestions">
        ${recruiterPrompts.map(prompt => `<button type="button" class="cb-chip" data-prompt="${prompt}">${prompt}</button>`).join('')}
      </div>
      <form class="cb-input-bar" id="cb-form" autocomplete="off">
        <input class="cb-input" id="cb-input" type="text" placeholder="Ask a hiring question..." maxlength="500" required />
        <button class="cb-send" id="cb-send" type="submit" aria-label="Send message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
  `;

  // ── Element refs ───────────────────────────────────────────────────
  const fab = document.getElementById('cb-fab');
  const win = document.getElementById('cb-window');
  const closeBtn = document.getElementById('cb-close');
  const soundBtn = document.getElementById('cb-sound');
  const msgContainer = document.getElementById('cb-messages');
  const suggestions = document.getElementById('cb-suggestions');
  const form = document.getElementById('cb-form');
  const input = document.getElementById('cb-input');

  // ── Helpers ────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  };

  const ensureAudio = () => {
    if (!soundEnabled) return null;
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  };

  const playTone = (type) => {
    const ctx = ensureAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const frequency = type === 'send' ? 640 : type === 'open' ? 520 : 760;
    const duration = type === 'type' ? 0.035 : 0.08;

    oscillator.type = type === 'type' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(type === 'type' ? 0.012 : 0.035, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  };

  const appendMessage = (role, text, options = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = `cb-msg cb-msg--${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'cb-msg-bubble';
    if (options.typing) {
      bubble.classList.add('cb-msg-bubble--typing');
    } else {
      bubble.textContent = text;
    }
    wrapper.appendChild(bubble);
    msgContainer.appendChild(wrapper);
    scrollToBottom();
    return bubble;
  };

  const typeAssistantMessage = (text) => {
    if (activeTypeTimer) {
      clearTimeout(activeTypeTimer);
      activeTypeTimer = null;
    }

    const bubble = appendMessage('assistant', '', { typing: true });
    const chars = [...text];
    let index = 0;

    const typeNext = () => {
      const chunkSize = chars[index] === ' ' ? 2 : 1;
      bubble.textContent += chars.slice(index, index + chunkSize).join('');
      index += chunkSize;
      scrollToBottom();

      if (index % 14 === 0) playTone('type');

      if (index < chars.length) {
        const currentChar = chars[index - 1] || '';
        const delay = /[.!?]/.test(currentChar) ? 90 : /[,;:]/.test(currentChar) ? 55 : 16;
        activeTypeTimer = setTimeout(typeNext, delay);
      } else {
        bubble.classList.remove('cb-msg-bubble--typing');
        activeTypeTimer = null;
        playTone('reply');
      }
    };

    typeNext();
  };

  const showTypingIndicator = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cb-msg cb-msg--assistant cb-typing-wrap';
    wrapper.id = 'cb-typing';
    wrapper.innerHTML = '<div class="cb-msg-bubble cb-typing"><span></span><span></span><span></span><em>Mahima AI is shaping a concise answer</em></div>';
    msgContainer.appendChild(wrapper);
    scrollToBottom();
  };

  const removeTypingIndicator = () => {
    const el = document.getElementById('cb-typing');
    if (el) el.remove();
  };

  // ── Toggle ─────────────────────────────────────────────────────────
  const toggle = () => {
    isOpen = !isOpen;
    fab.classList.toggle('cb-fab--open', isOpen);
    win.classList.toggle('cb-window--open', isOpen);
    if (isOpen) {
      playTone('open');
      scrollToBottom();
      input.focus();
    }
  };

  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.classList.toggle('cb-sound-toggle--muted', !soundEnabled);
    if (soundEnabled) playTone('open');
  });

  suggestions.addEventListener('click', (e) => {
    const chip = e.target.closest('.cb-chip');
    if (!chip || isLoading) return;
    input.value = chip.dataset.prompt || chip.textContent;
    playTone('open');
    form.requestSubmit();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) toggle();
  });

  // ── Send message ───────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isLoading) return;

    // Append user message
    appendMessage('user', text);
    playTone('send');
    chatHistory.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;
    suggestions.classList.add('cb-suggestions--disabled');
    isLoading = true;

    showTypingIndicator();

    try {
      // Call serverless API endpoint (keeps API key hidden in env vars)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      removeTypingIndicator();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        typeAssistantMessage(errData.error || 'Sorry, something went wrong. Please try again.');
      } else {
        const data = await res.json();
        const reply = data.reply || 'Sorry, I could not generate a response.';
        typeAssistantMessage(reply);
        chatHistory.push({ role: 'assistant', content: reply });
      }
    } catch (err) {
      removeTypingIndicator();
      typeAssistantMessage('Network error. Please check your connection and try again.');
    }

    isLoading = false;
    input.disabled = false;
    suggestions.classList.remove('cb-suggestions--disabled');
    input.focus();
  });
})();
