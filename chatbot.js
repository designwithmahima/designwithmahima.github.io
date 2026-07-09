/* chatbot.js — Premium floating chatbot widget for Mahima's Portfolio
 * Only activates on Vercel or localhost (never on GitHub Pages).
 */

(function () {
  'use strict';

  // ── Gate: only run on Vercel or local dev ──────────────────────────
  const hostname = window.location.hostname;
  const isVercel = hostname.endsWith('.vercel.app') || hostname.endsWith('.vercel.sh');
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';

  if (!isVercel && !isLocalDev) return; // silently skip on GitHub Pages

  // ── State ──────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  const chatHistory = []; // { role, content }

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
            <div class="cb-header-title">Ask Mahima's AI</div>
            <div class="cb-header-sub">Portfolio assistant · Powered by AI</div>
          </div>
        </div>
        <button class="cb-header-close" id="cb-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="cb-messages" id="cb-messages">
        <div class="cb-msg cb-msg--assistant">
          <div class="cb-msg-bubble">Hi there! 👋 I'm Mahima's portfolio assistant. Ask me anything about her work, skills, or how to get in touch!</div>
        </div>
      </div>
      <form class="cb-input-bar" id="cb-form" autocomplete="off">
        <input class="cb-input" id="cb-input" type="text" placeholder="Ask about Mahima's work..." maxlength="500" required />
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
  const msgContainer = document.getElementById('cb-messages');
  const form = document.getElementById('cb-form');
  const input = document.getElementById('cb-input');

  // ── Helpers ────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  };

  const appendMessage = (role, text) => {
    const wrapper = document.createElement('div');
    wrapper.className = `cb-msg cb-msg--${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'cb-msg-bubble';
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    msgContainer.appendChild(wrapper);
    scrollToBottom();
  };

  const showTypingIndicator = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'cb-msg cb-msg--assistant cb-typing-wrap';
    wrapper.id = 'cb-typing';
    wrapper.innerHTML = '<div class="cb-msg-bubble cb-typing"><span></span><span></span><span></span></div>';
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
      scrollToBottom();
      input.focus();
    }
  };

  fab.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

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
    chatHistory.push({ role: 'user', content: text });
    input.value = '';
    input.disabled = true;
    isLoading = true;

    showTypingIndicator();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      removeTypingIndicator();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        appendMessage('assistant', errData.error || 'Sorry, something went wrong. Please try again.');
      } else {
        const data = await res.json();
        const reply = data.reply || 'Sorry, I could not generate a response.';
        appendMessage('assistant', reply);
        chatHistory.push({ role: 'assistant', content: reply });
      }
    } catch (err) {
      removeTypingIndicator();
      appendMessage('assistant', 'Network error. Please check your connection and try again.');
    }

    isLoading = false;
    input.disabled = false;
    input.focus();
  });
})();
