/* chatbot.js — Premium floating chatbot widget for Mahima's Portfolio
 * Activates everywhere except GitHub Pages.
 * API key is kept server-side via /api/chat endpoint.
 */

(function () {
  'use strict';

  // ── Gate: disable only on GitHub Pages ─────────────────────────────
  const hostname = window.location.hostname;

  // Chatbot disabled on GitHub Pages (no server-side env vars available)
  if (hostname === 'designwithmahima.github.io' || hostname.endsWith('.github.io')) return;

  // ── State ──────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let audioCtx = null;
  let soundEnabled = true;
  let voiceReplyEnabled = localStorage.getItem('cbVoiceReply') === 'on';
  let liquidGlassEnabled = localStorage.getItem('cbLiquidGlass') !== 'off';
  let activeTypeTimer = null;
  let recognition = null;
  let isListening = false;
  let isReadingDoc = false;
  const attachedDocs = [];
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
          <button class="cb-liquid-toggle" id="cb-liquid" type="button" aria-label="Toggle liquid glass background" title="Toggle liquid glass">
            <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
              <path d="M12 3.2c3.9 3.8 6.2 7 6.2 10.1a6.2 6.2 0 1 1-12.4 0C5.8 10.2 8.1 7 12 3.2Z" fill="none" stroke="currentColor" stroke-width="1.8"/>
              <path d="M9.2 13.2c.2 1.7 1.3 2.7 3.1 2.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="cb-voice-toggle" id="cb-voice" type="button" aria-label="Toggle spoken replies" title="Toggle spoken replies">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M16 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a9 9 0 0 1 0 14"></path></svg>
          </button>
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
        <input class="cb-file-input" id="cb-file" type="file" accept=".txt,.md,.csv,.json,.pdf,.docx,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
        <button class="cb-attach" id="cb-attach" type="button" aria-label="Attach document" title="Attach document">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
        </button>
        <input class="cb-input" id="cb-input" type="text" placeholder="Ask a hiring question..." maxlength="500" required />
        <button class="cb-mic" id="cb-mic" type="button" aria-label="Speak your question" title="Speak your question">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
        </button>
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
  const liquidBtn = document.getElementById('cb-liquid');
  const voiceBtn = document.getElementById('cb-voice');
  const soundBtn = document.getElementById('cb-sound');
  const msgContainer = document.getElementById('cb-messages');
  const suggestions = document.getElementById('cb-suggestions');
  const form = document.getElementById('cb-form');
  const input = document.getElementById('cb-input');
  const fileInput = document.getElementById('cb-file');
  const attachBtn = document.getElementById('cb-attach');
  const micBtn = document.getElementById('cb-mic');

  // ── Helpers ────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  };

  const applyLiquidGlass = () => {
    win.classList.toggle('cb-window--liquid', liquidGlassEnabled);
    liquidBtn.classList.toggle('cb-liquid-toggle--active', liquidGlassEnabled);
  };

  const applyVoiceReply = () => {
    voiceBtn.classList.toggle('cb-voice-toggle--active', voiceReplyEnabled);
  };

  const cleanDisplayText = (text) => {
    return String(text || '')
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

  const truncateDocText = (text) => {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);
  };

  const readTextFile = async (file) => truncateDocText(await file.text());

  const readPdfFile = async (file) => {
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.10.38/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];

    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 12); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }

    return truncateDocText(pages.join('\n\n'));
  };

  const readDocxFile = async (file) => {
    const mammothModule = await import('https://esm.sh/mammoth@1.8.0/mammoth.browser');
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return truncateDocText(result.value);
  };

  const extractDocumentText = async (file) => {
    const name = file.name.toLowerCase();
    const type = file.type || '';

    if (file.size > 8 * 1024 * 1024) {
      throw new Error('Please attach a file under 8 MB.');
    }

    if (type.startsWith('text/') || /\.(txt|md|csv|json|html|css|js)$/i.test(name)) {
      return readTextFile(file);
    }

    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return readPdfFile(file);
    }

    if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      name.endsWith('.docx')
    ) {
      return readDocxFile(file);
    }

    throw new Error('Supported docs: TXT, MD, CSV, JSON, PDF, and DOCX.');
  };

  const removeDocChip = (name) => {
    document.querySelector(`.cb-doc-chip[data-doc="${CSS.escape(name)}"]`)?.remove();
  };

  const removeDoc = (name) => {
    const index = attachedDocs.findIndex((doc) => doc.name === name);
    if (index >= 0) attachedDocs.splice(index, 1);
    removeDocChip(name);
  };

  const appendDocChip = (doc) => {
    const chip = document.createElement('div');
    chip.className = 'cb-doc-chip';
    chip.dataset.doc = doc.name;
    chip.innerHTML = `
      <span>${doc.name}</span>
      <button type="button" aria-label="Remove ${doc.name}">&times;</button>
    `;
    chip.querySelector('button').addEventListener('click', () => removeDoc(doc.name));
    msgContainer.appendChild(chip);
    scrollToBottom();
  };

  const buildUserContent = (text) => {
    if (!attachedDocs.length) return text;
    const docs = attachedDocs
      .map((doc, index) => `Document ${index + 1}: ${doc.name}\n${doc.text}`)
      .join('\n\n---\n\n');
    return `${text}\n\nAttached document context for answering this question:\n${docs}`;
  };

  const speakText = (text) => {
    if (!voiceReplyEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanDisplayText(text));
    utterance.rate = 0.98;
    utterance.pitch = 1.04;
    utterance.volume = 0.88;
    window.speechSynthesis.speak(utterance);
  };

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportsSpeechRecognition = Boolean(SpeechRecognition);

  if (supportsSpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.addEventListener('start', () => {
      isListening = true;
      micBtn.classList.add('cb-mic--listening');
      input.placeholder = 'Listening...';
      playTone('open');
    });

    recognition.addEventListener('result', (event) => {
      const transcript = [...event.results]
        .map((result) => result[0]?.transcript || '')
        .join('')
        .trim();
      if (transcript) input.value = transcript;
    });

    recognition.addEventListener('end', () => {
      isListening = false;
      micBtn.classList.remove('cb-mic--listening');
      input.placeholder = 'Ask a hiring question...';
      input.focus();
    });

    recognition.addEventListener('error', () => {
      isListening = false;
      micBtn.classList.remove('cb-mic--listening');
      input.placeholder = 'Voice input unavailable';
      setTimeout(() => {
        input.placeholder = 'Ask a hiring question...';
      }, 1600);
    });
  } else {
    micBtn.disabled = true;
    micBtn.title = 'Voice input is not supported in this browser';
  }

  const appendMessage = (role, text, options = {}) => {
    const wrapper = document.createElement('div');
    wrapper.className = `cb-msg cb-msg--${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'cb-msg-bubble';
    if (options.typing) {
      bubble.classList.add('cb-msg-bubble--typing');
    } else {
      bubble.textContent = cleanDisplayText(text);
    }
    wrapper.appendChild(bubble);
    msgContainer.appendChild(wrapper);
    scrollToBottom();
    return bubble;
  };

  const typeAssistantMessage = (text) => {
    const cleanText = cleanDisplayText(text);

    if (activeTypeTimer) {
      clearTimeout(activeTypeTimer);
      activeTypeTimer = null;
    }

    const bubble = appendMessage('assistant', '', { typing: true });
    const chars = [...cleanText];
    let index = 0;

    return new Promise((resolve) => {
      const typeNext = () => {
        const remaining = chars.length - index;
        const chunkSize = chars.length > 620 ? 2 : 1;
        bubble.textContent += chars.slice(index, index + Math.min(chunkSize, remaining)).join('');
        index += chunkSize;
        scrollToBottom();

        if (index % 18 === 0) playTone('type');

        if (index < chars.length) {
          const currentChar = chars[index - 1] || '';
          const delay = chars.length > 620 ? 8 : /[.!?]/.test(currentChar) ? 85 : /[,;:]/.test(currentChar) ? 48 : currentChar === ' ' ? 18 : 22;
          activeTypeTimer = setTimeout(typeNext, delay);
        } else {
          bubble.classList.remove('cb-msg-bubble--typing');
          activeTypeTimer = null;
          playTone('reply');
          resolve();
        }
      };

      typeNext();
    });
  };

  const appendActions = (actions = []) => {
    if (!Array.isArray(actions) || actions.length === 0) return;

    const row = document.createElement('div');
    row.className = 'cb-action-row';

    actions.forEach((action) => {
      if (!action?.href || !action?.label) return;

      const link = document.createElement('a');
      link.className = `cb-action cb-action--${action.type || 'link'}`;
      link.href = action.href;
      link.textContent = action.label;

      if (!action.href.startsWith('mailto:') && !action.href.startsWith('tel:')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      link.addEventListener('click', () => playTone('send'));
      row.appendChild(link);
    });

    if (row.children.length) {
      msgContainer.appendChild(row);
      scrollToBottom();
    }
  };

  const appendConfirmation = () => {
    const row = document.createElement('div');
    row.className = 'cb-confirm';
    row.innerHTML = `
      <span>Was this helpful?</span>
      <button type="button" data-confirm="yes">Yes</button>
      <button type="button" data-confirm="no">Improve</button>
    `;

    row.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      const isYes = button.dataset.confirm === 'yes';
      row.classList.add('cb-confirm--answered');
      row.innerHTML = `<span>${isYes ? 'Glad it helped.' : 'Try asking for role fit, project impact, or contact details.'}</span>`;
      playTone(isYes ? 'reply' : 'open');
    }, { once: true });

    msgContainer.appendChild(row);
    scrollToBottom();
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
  liquidBtn.addEventListener('click', () => {
    liquidGlassEnabled = !liquidGlassEnabled;
    localStorage.setItem('cbLiquidGlass', liquidGlassEnabled ? 'on' : 'off');
    applyLiquidGlass();
    playTone('open');
  });
  voiceBtn.addEventListener('click', () => {
    voiceReplyEnabled = !voiceReplyEnabled;
    localStorage.setItem('cbVoiceReply', voiceReplyEnabled ? 'on' : 'off');
    applyVoiceReply();
    playTone('open');
    if (!voiceReplyEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.classList.toggle('cb-sound-toggle--muted', !soundEnabled);
    if (soundEnabled) playTone('open');
  });

  micBtn.addEventListener('click', () => {
    if (!recognition || isLoading) return;
    if (isListening) {
      recognition.stop();
      return;
    }
    try {
      recognition.start();
    } catch (err) {
      recognition.stop();
    }
  });

  attachBtn.addEventListener('click', () => {
    if (!isLoading && !isReadingDoc) fileInput.click();
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;

    isReadingDoc = true;
    attachBtn.classList.add('cb-attach--loading');
    attachBtn.disabled = true;
    input.placeholder = 'Reading document...';

    try {
      const text = await extractDocumentText(file);
      if (!text) throw new Error('I could not find readable text in that document.');
      const doc = { name: file.name, text };
      const existingIndex = attachedDocs.findIndex((item) => item.name === doc.name);
      if (existingIndex >= 0) {
        attachedDocs[existingIndex] = doc;
        removeDocChip(doc.name);
      } else {
        attachedDocs.push(doc);
      }
      appendDocChip(doc);
      input.placeholder = 'Ask about the attached doc...';
      playTone('reply');
    } catch (err) {
      await typeAssistantMessage(err.message || 'I could not read that document.');
      input.placeholder = 'Ask a hiring question...';
    } finally {
      isReadingDoc = false;
      attachBtn.classList.remove('cb-attach--loading');
      attachBtn.disabled = false;
      input.focus();
    }
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

  applyLiquidGlass();
  applyVoiceReply();

  // ── Send message ───────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isLoading) return;

    // Append user message
    appendMessage('user', text);
    playTone('send');
    chatHistory.push({ role: 'user', content: buildUserContent(text) });
    attachedDocs.splice(0, attachedDocs.length);
    document.querySelectorAll('.cb-doc-chip').forEach((chip) => chip.remove());
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
        await typeAssistantMessage(errData.error || 'Sorry, something went wrong. Please try again.');
      } else {
        const data = await res.json();
        const reply = data.reply || 'Sorry, I could not generate a response.';
        const cleanReply = cleanDisplayText(reply);
        await typeAssistantMessage(cleanReply);
        speakText(cleanReply);
        appendActions(data.actions);
        appendConfirmation();
        chatHistory.push({ role: 'assistant', content: cleanReply });
      }
    } catch (err) {
      removeTypingIndicator();
      await typeAssistantMessage('Network error. Please check your connection and try again.');
    }

    isLoading = false;
    input.disabled = false;
    suggestions.classList.remove('cb-suggestions--disabled');
    input.focus();
  });
})();
