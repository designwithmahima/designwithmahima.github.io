/* main.js - Mahima Gupta Portfolio Interactive Script */

(function() {
  'use strict';

  // 1. CUSTOM CURSOR
  const cursor = document.getElementById('cursor');
  const interactives = 'a, button, .hero-face, .project-card, .insight-card, .hamburger, .contact-close';

  if (cursor) {
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let cursorX = mouseX, cursorY = mouseY;
    let currentAngle = 0;
    let currentScaleX = 1;
    let currentScaleY = 1;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor interpolation with velocity squish (Jelly effect)
    const tickCursor = () => {
      const ease = 0.22;
      const dx = mouseX - cursorX;
      const dy = mouseY - cursorY;

      cursorX += dx * ease;
      cursorY += dy * ease;

      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) {
        currentAngle = Math.atan2(dy, dx);
      }

      // Squeeze effect based on movement speed
      const speed = Math.min(dist * 0.02, 0.4);
      currentScaleX += ((1 + speed) - currentScaleX) * 0.2;
      currentScaleY += ((1 - speed) - currentScaleY) * 0.2;

      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) rotate(${currentAngle}rad) scale(${currentScaleX}, ${currentScaleY})`;
      requestAnimationFrame(tickCursor);
    };
    tickCursor();

    // Expand cursor on hover
    const addHoverListeners = () => {
      document.querySelectorAll(interactives).forEach(el => {
        // Prevent duplicate listeners
        if (el.dataset.hasCursorListener) return;
        el.dataset.hasCursorListener = 'true';

        el.addEventListener('mouseenter', () => cursor.classList.add('expanded'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('expanded'));
      });
    };

    addHoverListeners();
    // Re-bind dynamically created elements or mutations
    const observer = new MutationObserver(addHoverListeners);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // 2. HERO DECORATIVE ICON PARALLAX
  const emojiLayer = document.getElementById('hero-emoji-layer');
  const heroSection = document.getElementById('hero-section');

  if (emojiLayer && heroSection) {
    const MAX_BLUR = 12;
    const emojis = emojiLayer.querySelectorAll('.fe');

    const updateHeroParallax = () => {
      const scrollY = window.scrollY;
      const heroHeight = heroSection.offsetHeight;
      const windowHeight = window.innerHeight;
      const workEl = document.getElementById('work');

      // Gradual blur and opacity fade
      const blurStart = heroHeight * 0.1;
      const blurEnd = workEl ? workEl.offsetTop - windowHeight * 0.05 : heroHeight;

      let progress = 0;
      if (scrollY > blurStart) {
        progress = Math.min((scrollY - blurStart) / Math.max(blurEnd - blurStart, 1), 1);
      }

      const scrollBlurVal = progress * MAX_BLUR;
      const opacityVal = 1 - progress * 0.65;
      const isMobile = window.innerWidth <= 768;

      emojis.forEach(el => {
        // Individual Parallax factor calculation based on depth classes
        let speed = 0.35; // default mid factor
        if (el.classList.contains('near')) {
          speed = 0.55;
        } else if (el.classList.contains('far')) {
          speed = 0.18;
        }

        const translateVal = -(scrollY * speed);
        el.style.transform = `translate3d(0, ${translateVal.toFixed(1)}px, 0)`;

        // Base blur for mobile to prevent distracting overlaps, overlaid with scroll blur
        let baseBlur = isMobile ? 5 : 0;
        let finalBlur = Math.max(baseBlur, scrollBlurVal);
        el.style.filter = finalBlur > 0 ? `blur(${finalBlur.toFixed(1)}px)` : '';

        // Slightly lower base opacity on mobile to recede further
        let finalOpacity = isMobile ? opacityVal * 0.55 : opacityVal;
        el.style.opacity = finalOpacity.toFixed(3);
      });
    };

    window.addEventListener('scroll', updateHeroParallax, { passive: true });
    window.addEventListener('resize', updateHeroParallax);

    updateHeroParallax();
  }

  // 2b. HERO VIDEO SOUND TOGGLE
  const soundToggleBtn = document.getElementById('hero-sound-toggle');
  const heroVideo = document.querySelector('.hero-avatar-video');

  if (heroVideo) {
    // Dynamically inject to bypass HTML strict linter while keeping iOS support
    heroVideo.setAttribute('playsinline', '');
  }

  if (soundToggleBtn && heroVideo) {
    const offIcon = soundToggleBtn.querySelector('.sound-off');
    const onIcon = soundToggleBtn.querySelector('.sound-on');
    let autoMuteTimer;

    const updateSoundUI = () => {
      if (heroVideo.muted) {
        offIcon.style.display = 'inline';
        onIcon.style.display = 'none';
      } else {
        offIcon.style.display = 'none';
        onIcon.style.display = 'inline';
      }
    };

    soundToggleBtn.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent navigating to #work link
      e.stopPropagation();

      // Cancel auto-mute if user manually interacts
      if (autoMuteTimer) clearTimeout(autoMuteTimer);

      heroVideo.muted = !heroVideo.muted;
      updateSoundUI();

      // Always ensure the video keeps playing when toggled, even if muted
      heroVideo.play().catch(() => {});
    });

    // Auto-play sound on first interaction, then turn off after 5 seconds
    let hasRunAutoAudio = false;
    const triggerAutoAudio = () => {
      if (hasRunAutoAudio) return;
      hasRunAutoAudio = true;

      heroVideo.muted = false;
      const playPromise = heroVideo.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          updateSoundUI();
          // Auto turn-off after 5 seconds
          autoMuteTimer = setTimeout(() => {
            heroVideo.muted = true;
            updateSoundUI();
            heroVideo.play().catch(() => {}); // Keep video looping seamlessly
          }, 5000);
        }).catch(() => {
          // Fallback if browser still blocks it
          heroVideo.muted = true;
          updateSoundUI();
          heroVideo.play().catch(() => {});
        });
      }

      // Remove listeners once triggered
      ['click', 'scroll', 'touchstart'].forEach(evt => {
        window.removeEventListener(evt, triggerAutoAudio);
      });
    };

    // Listen for the first natural user interaction to bypass autoplay block
    ['click', 'scroll', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, triggerAutoAudio, { once: true, passive: true });
    });
  }

  // 3. SCROLL-DRAWN WAVEY LINE
  const canvas = document.getElementById('grow-line-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;
    let particles = [];

    // Pre-generate scattered galaxy stars
    const generateParticles = () => {
      particles = [];
      const count = Math.floor(W * 0.7); // More stars for full screen effect
      const spreadAmp = H * 0.6; // Huge spread for creeper effect

      for (let i = 0; i < count; i++) {
        const x = Math.random() * W;
        // Gaussian distribution for cluster effect (dense in middle, sparse at edges)
        const u = Math.max(Math.random(), 0.0001);
        const v = Math.random();
        const spreadNormal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

        const yOffset = spreadNormal * spreadAmp; // Much larger spread height
        const size = Math.random() * 1.5 + 0.4; // Star size
        const alpha = Math.random() * 0.7 + 0.3; // Base opacity
        particles.push({ x, yOffset, size, alpha });
      }
    };

    const resizeCanvas = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      generateParticles();
      drawGrowLine();
    };
    window.addEventListener('resize', resizeCanvas);

    let headProgress = 0;
    let tailProgress = 0;

    const drawGrowLine = () => {
      ctx.clearRect(0, 0, W, H);
      if (headProgress <= 0 && tailProgress <= 0) return;

      const totalWidth = W;
      const headX = totalWidth * headProgress;
      const tailX = totalWidth * tailProgress;

      if (headX - tailX < 2) return;

      const rootStyles = getComputedStyle(document.documentElement);
      const accentColor1 = rootStyles.getPropertyValue('--accent').trim() || '#1a6fff';
      const accentColor2 = rootStyles.getPropertyValue('--accent2').trim() || '#4f3fd9';
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, accentColor1);
      grad.addColorStop(0.5, accentColor2);
      grad.addColorStop(1, accentColor1);

      ctx.save();

      const baselineY = H * 0.5;
      const baseAmplitude = Math.min(H * 0.4, 400); // Much larger base wave height for creeper effect
      const baseFrequency = (Math.PI * 3) / W; // Spread out frequency

      // Define multiple intertwining lines spreading like creepers/vines across the screen
      const lines = [
        { yOffset: 0, ampMult: 0.1, freqMult: 1.5, phase: 0, widthMult: 1.5, alpha: 0.8 },
        { yOffset: -H * 0.2, ampMult: 0.8, freqMult: 0.8, phase: 0, widthMult: 1.0, alpha: 0.6 },
        { yOffset: H * 0.2, ampMult: -0.7, freqMult: 1.1, phase: Math.PI / 4, widthMult: 0.8, alpha: 0.5 },
        { yOffset: -H * 0.35, ampMult: 0.9, freqMult: 0.6, phase: Math.PI / 2, widthMult: 0.5, alpha: 0.4 },
        { yOffset: H * 0.35, ampMult: 0.5, freqMult: 2.2, phase: Math.PI, widthMult: 0.4, alpha: 0.6 },
        { yOffset: -H * 0.1, ampMult: 1.2, freqMult: 0.9, phase: Math.PI * 1.5, widthMult: 0.6, alpha: 0.5 },
        { yOffset: H * 0.1, ampMult: -1.1, freqMult: 0.7, phase: Math.PI * 0.7, widthMult: 0.7, alpha: 0.4 }
      ];

      lines.forEach(line => {
        ctx.beginPath();
        const amp = baseAmplitude * line.ampMult;
        const freq = baseFrequency * line.freqMult;
        const phase = line.phase;

        for (let x = tailX; x <= headX; x += 3) {
          const y = baselineY + line.yOffset + Math.sin(x * freq + phase) * amp;
          if (x === tailX) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Glowing aura for this thread
        ctx.filter = 'blur(12px)';
        ctx.globalAlpha = line.alpha * 0.3; // Softer glow multiplier
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(10, H * 0.02) * line.widthMult;
        ctx.stroke();

        // Bright core for this thread
        ctx.filter = 'none';
        ctx.globalAlpha = line.alpha;
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(2, H * 0.004) * line.widthMult;
        ctx.stroke();
      });

      // Draw Galaxy / Fractal Stars around the timeline
      ctx.save();
      const coreFreq = baseFrequency * 1.5; // Matches the core energy thread

      particles.forEach(p => {
        if (p.x >= tailX && p.x <= headX) {
          // Broadly follow the waves but scattered across the screen
          const coreY = baselineY + Math.sin(p.x * coreFreq) * (baseAmplitude * 0.3);
          const y = coreY + p.yOffset;

          // Sparkle flare effect at the leading edge
          const distToHead = headX - p.x;
          const scale = distToHead < 50 ? 1 + (50 - distToHead) / 12 : 1;

          ctx.beginPath();
          ctx.arc(p.x, y, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = grad;

          if (p.size > 1.2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = accentColor1;
          }

          // Smooth fade out at the tail
          let pAlpha = p.alpha;
          if (p.x - tailX < 60) pAlpha *= (p.x - tailX) / 60;

          ctx.globalAlpha = pAlpha * 0.9;
          ctx.fill();
        }
      });
      ctx.restore();

      ctx.restore();
    };

    const handleScrollGrowLine = () => {
      const workEl = document.getElementById('work');
      if (!workEl) return;

      const workTop = workEl.offsetTop;
      const workHeight = workEl.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      const enterStart = workTop - windowHeight;
      const enterEnd = workTop + workHeight * 0.4;
      const exitStart = workTop + workHeight * 0.45;
      const exitEnd = workTop + workHeight;

      if (scrollY < enterStart) {
        headProgress = 0;
        tailProgress = 0;
      } else if (scrollY <= enterEnd) {
        headProgress = (scrollY - enterStart) / (enterEnd - enterStart);
        tailProgress = 0;
      } else if (scrollY <= exitEnd) {
        headProgress = 1;
        tailProgress = (scrollY - exitStart) / (exitEnd - exitStart);
      } else {
        headProgress = 0;
        tailProgress = 0;
      }

      drawGrowLine();
    };

    window.addEventListener('scroll', handleScrollGrowLine, { passive: true });
    resizeCanvas();
  }

  // 4. HAMBURGER MENU ACTIONS
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu-overlay');

  if (hamburgerBtn && mobileMenu) {
    const toggleMenu = () => {
      const open = hamburgerBtn.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    hamburgerBtn.addEventListener('click', toggleMenu);

    mobileMenu.querySelectorAll('.mobile-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        hamburgerBtn.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // 6. CONTACT MODAL & FORM SUBMISSION
  const contactModal = document.getElementById('contact-modal');
  const contactCloseBtn = document.getElementById('contact-close-btn');
  const mailForm = document.getElementById('contact-mail-form');
  const formWrap = document.getElementById('contact-form-container');
  const successScreen = document.getElementById('contact-success-screen');

  const openContact = (e) => {
    if (e) e.preventDefault();
    if (contactModal) {
      if (formWrap) formWrap.style.display = 'block';
      if (successScreen) successScreen.style.display = 'none';
      if (mailForm) mailForm.reset();
      contactModal.classList.add('active');
    }
  };

  const closeContact = () => {
    if (contactModal) contactModal.classList.remove('active');
  };

  document.querySelectorAll('.open-contact-trigger').forEach(btn => {
    btn.addEventListener('click', openContact);
  });

  if (contactCloseBtn) contactCloseBtn.addEventListener('click', closeContact);
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) closeContact();
    });
  }

  // ESC key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeContact();
    }
  });

  // Simulated Asynchronous email submission
  if (mailForm) {
    mailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contact-submit-btn');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending Message...';
      submitBtn.disabled = true;

      // Mock delay
      setTimeout(() => {
        if (formWrap) formWrap.style.display = 'none';
        if (successScreen) successScreen.style.display = 'block';
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 1200);
    });
  }

  // 7. SCROLL REVEAL (Intersection Observer)
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if not supported
    revealElements.forEach(el => el.classList.add('in'));
  }

  // 7b. PEEKING AVATARS REVEAL
  // Watch the .peeking-stage wrapper (it's not clipped by IntersectionObserver)
  // and trigger .visible on the inner .peeking-avatar
  const peekStages = document.querySelectorAll('.peeking-stage');
  if ('IntersectionObserver' in window && peekStages.length > 0) {
    const peekObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate the inner peeking avatar
          const avatar = entry.target.querySelector('.reveal-peek');
          if (avatar) avatar.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    peekStages.forEach(el => peekObserver.observe(el));
  } else {
    // Fallback
    document.querySelectorAll('.reveal-peek').forEach(el => el.classList.add('visible'));
  }

  // 8. ACCENT COLOR PICKER
  const pickers = document.querySelectorAll('.accent-picker');
  const storedAccent = localStorage.getItem('accent') || 'blue';

  const applyAccent = (accentName) => {
    if (accentName === 'blue') {
      document.documentElement.removeAttribute('data-accent');
    } else {
      document.documentElement.setAttribute('data-accent', accentName);
    }
    localStorage.setItem('accent', accentName);

    // Update active states
    pickers.forEach(picker => {
      picker.querySelectorAll('.accent-dot').forEach(dot => {
        if (dot.dataset.accent === accentName) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    });
  };

  // Init color accent
  applyAccent(storedAccent);

  const splashOverlay = document.getElementById('color-splash-overlay');
  const accentColors = {
    blue: '#1a6fff',
    violet: '#8b5cf6',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b'
  };

  // Click handlers
  pickers.forEach(picker => {
    picker.addEventListener('click', (e) => {
      const dot = e.target.closest('.accent-dot');
      if (dot) {
        // Prevent redundant splash if the same color is clicked
        if (dot.classList.contains('active')) return;

        const accentName = dot.dataset.accent;

        if (splashOverlay) {
          // Find origin point
          const rect = dot.getBoundingClientRect();
          const originX = rect.left + rect.width / 2;
          const originY = rect.top + rect.height / 2;
          const color = accentColors[accentName] || '#1a6fff';

          splashOverlay.style.setProperty('--origin-x', `${originX}px`);
          splashOverlay.style.setProperty('--origin-y', `${originY}px`);
          splashOverlay.style.setProperty('--splash-color', color);
          splashOverlay.style.setProperty('--splash-rot', `${Math.floor(Math.random() * 360)}deg`);

          splashOverlay.classList.remove('splashing');
          void splashOverlay.offsetWidth; // Force a browser reflow to reset animation
          splashOverlay.classList.add('splashing');

          // Apply the theme midway through the splash animation
          setTimeout(() => applyAccent(accentName), 400);
        } else {
          applyAccent(accentName);
        }
      }
    });
  });

  // Mobile avatar peeks respond to phone tilt, with tap/keyboard as a fallback.
  const mobilePeeks = [
    { element: document.getElementById('peek-about'), direction: -1 },
    { element: document.getElementById('peek-insights'), direction: 1 },
    { element: document.getElementById('peek-contact'), direction: 0.35 }
  ].filter(item => item.element);
  const mobileQuery = window.matchMedia('(max-width: 768px)');
  let orientationListening = false;
  let orientationFrame = null;

  const handleOrientation = (event) => {
    if (!mobileQuery.matches || typeof event.gamma !== 'number') return;
    const tilt = Math.max(-18, Math.min(18, event.gamma));
    if (orientationFrame) cancelAnimationFrame(orientationFrame);
    orientationFrame = requestAnimationFrame(() => {
      mobilePeeks.forEach(({ element, direction }) => {
        element.style.setProperty('--mobile-peek-shift', `${tilt * direction * 1.15}px`);
      });
    });
  };

  const startOrientation = () => {
    if (orientationListening || !('DeviceOrientationEvent' in window)) return;
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    orientationListening = true;
  };

  const requestOrientation = async () => {
    if (!('DeviceOrientationEvent' in window)) return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        if (await DeviceOrientationEvent.requestPermission() === 'granted') startOrientation();
      } catch (_) {
        // Tap remains available when motion permission is declined or unavailable.
      }
    } else {
      startOrientation();
    }
  };

  const toggleMobilePeek = (activeElement) => {
    if (!mobileQuery.matches) return;
    mobilePeeks.forEach(({ element }) => {
      element.classList.toggle('mobile-peek-open', element === activeElement && !element.classList.contains('mobile-peek-open'));
    });
    requestOrientation();
  };

  mobilePeeks.forEach(({ element }) => {
    element.addEventListener('click', () => toggleMobilePeek(element));
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleMobilePeek(element);
      }
    });
  });

  if (mobileQuery.matches && !('requestPermission' in (window.DeviceOrientationEvent || {}))) {
    startOrientation();
  }

  // 9. PDF VIEWER MODAL (for resume preview)
  const pdfModal = document.getElementById('pdf-modal');
  const pdfCloseBtn = document.getElementById('pdf-close-btn');
  const pdfViewerContainer = document.getElementById('pdf-viewer');
  let pdfEmbedLoaded = false;

  const openPdfViewer = async (e) => {
    if (e) e.preventDefault();
    if (pdfModal) {
      pdfModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Load EmbedPDF dynamically on first open
      if (!pdfEmbedLoaded && pdfViewerContainer) {
        try {
          const EmbedPDF = (await import('https://cdn.jsdelivr.net/npm/@embedpdf/snippet@2/dist/embedpdf.js')).default;
          EmbedPDF.init({
            type: 'container',
            target: pdfViewerContainer,
            src: '/assets/mahima_gupta_resume.pdf',
            theme: { preference: 'system' }
          });
          pdfEmbedLoaded = true;
        } catch (err) {
          console.error('Failed to load PDF viewer:', err);
          pdfViewerContainer.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--ink2);">Unable to load PDF viewer. Please use the Download button.</p>';
        }
      }
    }
  };

  const closePdfViewer = () => {
    if (pdfModal) {
      pdfModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Attach click handlers to all preview resume buttons
  document.querySelectorAll('#hero-cta-preview, #cta-btn-resume-preview, #mob-resume-preview').forEach(btn => {
    if (btn) btn.addEventListener('click', openPdfViewer);
  });

  if (pdfCloseBtn) {
    pdfCloseBtn.addEventListener('click', closePdfViewer);
  }
  
  if (pdfModal) {
    pdfModal.addEventListener('click', (e) => {
      if (e.target === pdfModal) closePdfViewer();
    });
  }

  // ESC key closes PDF modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePdfViewer();
    }
  });

  // 10. INTERACTIVE CASE STUDY SLIDE DECK MODAL
  const caseDecks = {
    patientvoice: {
      company: "Novacare Hospital • Healthcare Kiosk UX",
      title: "Patient Voice Helper: Hospital Wayfinding & Self Check-in Kiosk",
      figmaUrl: "https://www.figma.com/design/Ru8L9aH5AF8zdFM0YM8COk/case-study?node-id=94-12023",
      slides: [
        {
          num: "SLIDE 01 / 04",
          heading: "Overview & Problem Statement",
          desc: "Hospital lobbies experienced severe bottlenecking during peak morning hours. Patients faced confusion navigating multi-building OPD centers, while touchscreens created sanitization hesitation.",
          points: [
            "Challenge: Over 4.5 minutes average check-in duration per patient.",
            "Solution: Dual voice and touch kiosk enabling hands-free appointment lookup.",
            "Accessibility: High-contrast AAA visual layout for elderly & mobility-assisted patients."
          ],
          metrics: [
            { num: "4.5m ➔ 2.7m", label: "Check-in Duration" },
            { num: "92%", label: "Patient Usability Score" }
          ],
          image: "/assets/images/heyalpha-healthcare.png"
        },
        {
          num: "SLIDE 02 / 04",
          heading: "Conversational Voice & Wayfinding UX",
          desc: "Integrated an AI voice recognition loop built to operate under lobby background noise. Patients simply state 'Appointment with Dr. Sharma' to initiate check-in and receive animated floor maps.",
          points: [
            "Voice Intent Parsing: Recognizes department names, doctor aliases, and room numbers.",
            "Interactive Maps: Turn-by-turn visual pathing to elevator & OPD consultation rooms.",
            "Multilingual Support: Instant language switching between English, Hindi & regional dialects."
          ],
          metrics: [
            { num: "65%", label: "Fewer Helpdesk Queries" },
            { num: "< 800ms", label: "Voice Response Time" }
          ],
          image: "/assets/images/heyalpha-healthcare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  Voice Dialogue & Wayfinding
                </div>
                <span class="deck-ui-badge-live">Live Listening</span>
              </div>
              <div class="deck-ui-vui-bubble">
                <div class="deck-ui-wave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div><strong>Patient:</strong> "Appointment with Dr. Sharma, Cardiology"</div>
              </div>
              <div class="deck-ui-vui-bubble" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25);">
                <div><strong>Kiosk:</strong> "Token #C-24 generated. Proceed to Elevator B, 2nd Floor."</div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">◆ English / Hindi</span>
                <span class="deck-ui-token-chip">◆ Turn-by-Turn Map</span>
                <span class="deck-ui-token-chip">◆ &lt;800ms Latency</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 03 / 04",
          heading: "Figma Component & Kiosk Hardware Architecture",
          desc: "Designed auto-layout component libraries in Figma tailored for 32-inch portrait kiosk screens, ensuring 48px minimum touch targets and clear audio feedback indicators.",
          points: [
            "Figma System: Over 80 UI variants built with strict auto-layout padding.",
            "Micro-Interactions: Audio wave animations indicating when kiosk is listening.",
            "Hardware Integration: Thermal ticket printer trigger and RFID badge scanner support."
          ],
          metrics: [
            { num: "32\"", label: "Portrait Kiosk Target" },
            { num: "80+", label: "Figma Components" }
          ],
          image: "/assets/images/heyalpha-healthcare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/></svg>
                  Figma Component System
                </div>
                <span class="deck-ui-badge-live">80+ Variants</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">32"</div>
                  <div class="deck-ui-stat-label">Portrait Kiosk Screen</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">48px</div>
                  <div class="deck-ui-stat-label">Min Touch Target</div>
                </div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">Auto-Layout Variables</span>
                <span class="deck-ui-token-chip">WCAG AAA Contrast</span>
                <span class="deck-ui-token-chip">Thermal Print Handler</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 04 / 04",
          heading: "Clinical Outcome & Deployment Impact",
          desc: "Tested across pilot outpatient facilities with over 12,000 active patient sessions, delivering measurable queue reduction and positive hospital staff feedback.",
          points: [
            "Lobby Efficiency: Cut peak lobby queue length by 40%.",
            "Sanitization Safety: 74% of patients utilized voice commands without touching screen.",
            "Staff Feedback: Nurses spent 30% more time on critical care rather than wayfinding help."
          ],
          metrics: [
            { num: "12,000+", label: "Patient Sessions" },
            { num: "40%", label: "Queue Cut" }
          ],
          image: "/assets/images/heyalpha-healthcare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Novacare Hospital Pilot Status
                </div>
                <span class="deck-ui-badge-live">Live Verified</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">12,000+</div>
                  <div class="deck-ui-stat-label">Patient Sessions</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">-40%</div>
                  <div class="deck-ui-stat-label">Lobby Queue Time</div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Hands-Free Voice Usage</span>
                  <span>74%</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 74%;"></div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Patient Usability Rating</span>
                  <span>92%</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 92%; background: #10b981;"></div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    aksigen: {
      company: "Aksigen • Healthcare Product Ecosystem",
      title: "Aksigen Healthcare: Clinical Workflow & Patient Portal SaaS",
      figmaUrl: "https://www.figma.com/design/Ru8L9aH5AF8zdFM0YM8COk/case-study?node-id=158-13",
      slides: [
        {
          num: "SLIDE 01 / 04",
          heading: "Overview & Clinical Ecosystem",
          desc: "Aksigen required a unified, high-performance medical SaaS platform to streamline patient record management, diagnostic lab ordering, and physician schedules across multiple clinical departments.",
          points: [
            "Problem: Fragmented legacy EHR tools slowed down physician consultation cycles.",
            "Goal: Reduce cognitive load for doctors while improving patient record accuracy.",
            "Approach: Clean data density, dark mode radiology themes, and single-click prescription drafting."
          ],
          metrics: [
            { num: "94%", label: "Clinical Workflow Efficiency" },
            { num: "2.5x", label: "Faster Record Retrieval" }
          ],
          image: "/assets/images/medicare.png"
        },
        {
          num: "SLIDE 02 / 04",
          heading: "Doctor Dashboard & Patient Vitals",
          desc: "Architected a modular dashboard layout placing patient vital trends, allergy warnings, and active medications directly in the physician's primary field of view.",
          points: [
            "Vitals Sparklines: Real-time visual graphs for blood pressure, pulse, and oxygen levels.",
            "Quick Shortcuts: Keyboard navigation for fast prescription search & diagnosis entry.",
            "Contextual Drawer: Instant access to patient lab history without losing active consultation state."
          ],
          metrics: [
            { num: "0", label: "UI Input Errors in Test" },
            { num: "1-Click", label: "Lab Order Trigger" }
          ],
          image: "/assets/images/medicare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
                  Patient EHR & Clinical Vitals
                </div>
                <span class="deck-ui-badge-live">Active Patient #8841</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">120/80</div>
                  <div class="deck-ui-stat-label">Blood Pressure</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">98%</div>
                  <div class="deck-ui-stat-label">SpO2 Oxygen</div>
                </div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">◆ Zero Contrast Warnings</span>
                <span class="deck-ui-token-chip">◆ 1-Click Rx Draft</span>
                <span class="deck-ui-token-chip">◆ Lab Sync</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 03 / 04",
          heading: "Figma Design System & Clinical Tokens",
          desc: "Created a comprehensive Figma design system featuring color tokens, typography scales, and WCAG AAA compliant contrast levels tailored for hospital environments.",
          points: [
            "Design Tokens: Standardized medical status colors (Critical Red, Stable Green, Alert Amber).",
            "Figma Components: 120+ variant components with auto-layout constraints.",
            "Developer Handoff: Strict token naming mapping directly to React / Tailwind CSS variables."
          ],
          metrics: [
            { num: "120+", label: "Figma Variants" },
            { num: "AAA", label: "WCAG Contrast Level" }
          ],
          image: "/assets/images/medicare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>
                  Clinical Design System
                </div>
                <span class="deck-ui-badge-live">WCAG AAA</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">120+</div>
                  <div class="deck-ui-stat-label">UI Components</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">100%</div>
                  <div class="deck-ui-stat-label">Token Coverage</div>
                </div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">Primary #0284c7</span>
                <span class="deck-ui-token-chip">Radiology Dark Theme</span>
                <span class="deck-ui-token-chip">Auto-Layout 4.0</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 04 / 04",
          heading: "Results & Healthcare Scale",
          desc: "Deployed across clinical departments, enabling doctors to spend more face-to-face time with patients while reducing administrative documentation backlogs.",
          points: [
            "Time Saved: Average consultation documentation reduced by 3.2 minutes per patient.",
            "Record Retrieval: Lab report access speed improved by 250%.",
            "Physician Rating: Received a 4.9/5 satisfaction rating from practicing clinical staff."
          ],
          metrics: [
            { num: "3.2m", label: "Time Saved per Patient" },
            { num: "4.9 / 5", label: "Physician Rating" }
          ],
          image: "/assets/images/medicare.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Clinical Deployment Metrics
                </div>
                <span class="deck-ui-badge-live">Live Scale</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">3.2m</div>
                  <div class="deck-ui-stat-label">Saved Per Patient</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">4.9/5</div>
                  <div class="deck-ui-stat-label">Physician CSAT</div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Clinical Task Completion Rate</span>
                  <span>94%</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 94%;"></div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Diagnostic Speed Improvement</span>
                  <span>250%</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 100%; background: #0284c7;"></div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    ttribe: {
      company: "TTribe • Brand Identity & E-Commerce",
      title: "TTribe: Brand Identity & Streetwear Web Store",
      figmaUrl: "https://www.figma.com/proto/Ru8L9aH5AF8zdFM0YM8COk/case-study?node-id=159-554&scaling=min-zoom",
      slides: [
        {
          num: "SLIDE 01 / 04",
          heading: "Brand Identity & Brutalist Streetwear Vision",
          desc: "Crafted the brand identity and digital e-commerce storefront for TTribe, a luxury streetwear label. The visual language balances brutalist typography with high-fashion editorial imagery.",
          points: [
            "Visual Language: Monochrome palette with tactile industrial typography.",
            "Drop Experience: Designed around limited-quantity seasonal drops with hype timers.",
            "Editorial First: Seamless blend of runway lookbook photography and instant purchasing."
          ],
          metrics: [
            { num: "3.4x", label: "Lookbook Engagement" },
            { num: "62%", label: "Mobile Checkout Uplift" }
          ],
          image: "/assets/images/ttribe.png"
        },
        {
          num: "SLIDE 02 / 04",
          heading: "Drop Architecture & Lookbook Grid",
          desc: "Reimagined the apparel shopping journey through an interactive lookbook where customers shop directly from model photography without navigating away.",
          points: [
            "Hotspot Tagging: Tap any garment on the model to reveal sizing, price, and instant bag add.",
            "Infinite Lookbook: Smooth horizontal swipe on mobile with haptic micro-interactions.",
            "Stock Transparency: Live stock counter creates authentic urgency without dark patterns."
          ],
          metrics: [
            { num: "+48%", label: "Multi-item Cart Adds" },
            { num: "< 1.2s", label: "Page Load Benchmark" }
          ],
          image: "/assets/images/ttribe.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Drop 04 // Lookbook Engine
                </div>
                <span class="deck-ui-badge-live">Live Shop Hotspots</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">3.4x</div>
                  <div class="deck-ui-stat-label">Engagement</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">+48%</div>
                  <div class="deck-ui-stat-label">Cart Size</div>
                </div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">◆ Quick-Add Drawer</span>
                <span class="deck-ui-token-chip">◆ Fit Guide Matrix</span>
                <span class="deck-ui-token-chip">◆ Apple Pay 1-Tap</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 03 / 04",
          heading: "Fluid Cart & Micro-Interactions",
          desc: "Engineered a slide-over slide bag with instant size switching, real-time shipping threshold calculations, and 1-tap checkout via Apple Pay and Google Pay.",
          points: [
            "Zero Page Reloads: State persisted smoothly with optimistic UI updates.",
            "Size Predictor: Visual height/weight slider minimizing return rates.",
            "Express Checkout: Streamlined 1-tap buy button directly inside product cards."
          ],
          metrics: [
            { num: "35%", label: "Lower Return Rate" },
            { num: "1.8s", label: "Average Checkout Speed" }
          ],
          image: "/assets/images/ttribe.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
                  Slide Bag & Express Pay
                </div>
                <span class="deck-ui-badge-live">1-Tap Ready</span>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">Apple Pay</span>
                <span class="deck-ui-token-chip">Google Pay</span>
                <span class="deck-ui-token-chip">Dynamic Free Shipping</span>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Free Express Shipping Threshold</span>
                  <span>$120 / $100 (Unlocked!)</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 100%; background: #10b981;"></div>
                </div>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 04 / 04",
          heading: "Design System & Commerce Outcomes",
          desc: "Created a componentized design system in Figma with 150+ components, auto-layout tokens, responsive break points, and dark/light contrast rules.",
          points: [
            "Figma Component Library: 150+ production-ready design tokens and interactive variants.",
            "Conversion Results: 62% lift in mobile checkout completion over previous storefront.",
            "Community Resonance: Sold out Drop 04 inventory within 48 hours of launch."
          ],
          metrics: [
            { num: "62%", label: "Mobile Checkout Uplift" },
            { num: "48h", label: "Drop Sell-Out Record" }
          ],
          image: "/assets/images/ttribe.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Verified Commerce Impact
                </div>
                <span class="deck-ui-badge-live">150+ Figma Tokens</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">62%</div>
                  <div class="deck-ui-stat-label">Checkout Uplift</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">48h</div>
                  <div class="deck-ui-stat-label">Sell-out Time</div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Design Token Coverage</span>
                  <span>100% Production Ready</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 100%; background: #6366f1;"></div>
                </div>
              </div>
            </div>
          `
        }
      ]
    },
    foodvoice: {
      company: "HeyAlpha & Marriott Moxy • Hospitality AI Voice UI",
      title: "HeyAlpha Food Voice: Touchless Restaurant & Room Service Ordering",
      figmaUrl: "https://www.figma.com/design/Ru8L9aH5AF8zdFM0YM8COk/case-study?node-id=159-553",
      slides: [
        {
          num: "SLIDE 01 / 04",
          heading: "Overview & Zero-Friction Vision",
          desc: "Hotel guests and restaurant diners often face friction downloading native apps or waiting for staff during rush hours. HeyAlpha Food Voice allows instant QR scanning and natural voice ordering.",
          points: [
            "Zero App Download: Opens in any mobile browser in less than 1 second.",
            "Multimodal Experience: Speak natural voice orders or tap visual food cards.",
            "Target Brands: Implemented for Marriott Moxy in-room dining & Bikanervala tables."
          ],
          metrics: [
            { num: "78%", label: "Guest Adoption Rate" },
            { num: "3x", label: "Faster Order Placement" }
          ],
          image: "/assets/images/in-room-qr.png"
        },
        {
          num: "SLIDE 02 / 04",
          heading: "Conversational Voice Dialogue Engine",
          desc: "Designed intuitive voice UI states that guide guests through item selection, customization (e.g. 'extra spicy', 'no onions'), and dietary filter toggles.",
          points: [
            "Natural Language: Handles multi-item orders like '2 Cappuccinos and 1 Club Sandwich'.",
            "Smart Upselling: Non-intrusive AI recommendations for pairings (e.g. drinks, desserts).",
            "Visual Sync: Voice commands instantly highlight corresponding items on the screen."
          ],
          metrics: [
            { num: "22%", label: "Higher Order Value" },
            { num: "96%", label: "Voice Recognition Accuracy" }
          ],
          image: "/assets/images/in-room-qr.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  Conversational VUI Cart
                </div>
                <span class="deck-ui-badge-live">96% Accuracy</span>
              </div>
              <div class="deck-ui-vui-bubble">
                <div class="deck-ui-wave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div><strong>Guest:</strong> "2 Cappuccinos & 1 Club Sandwich, extra spicy"</div>
              </div>
              <div class="deck-ui-vui-bubble" style="background: rgba(236, 72, 153, 0.08); border-color: rgba(236, 72, 153, 0.25);">
                <div><strong>AI Butler:</strong> "Added to cart. Would you like blueberry cheesecake with that?"</div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">◆ Multi-item Parse</span>
                <span class="deck-ui-token-chip">◆ Smart Upsell +22%</span>
                <span class="deck-ui-token-chip">◆ Visual Sync</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 03 / 04",
          heading: "QR Table Integration & Kitchen KDS",
          desc: "Mapped encrypted QR parameters to dynamically populate hotel room numbers or restaurant table IDs, transmitting structured orders directly to Kitchen Display Systems (KDS).",
          points: [
            "Session Security: Encrypted token handling eliminates order tampering.",
            "Kitchen Sync: Real-time order status tracking ('Preparing', 'On the Way', 'Delivered').",
            "Payment Gateway: Integrated Apple Pay, Google Pay, and room charge billing."
          ],
          metrics: [
            { num: "< 1s", label: "QR Launch Speed" },
            { num: "Real-time", label: "Kitchen KDS Dispatch" }
          ],
          image: "/assets/images/in-room-qr.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
                  QR Room & Kitchen Pipeline
                </div>
                <span class="deck-ui-badge-live">Table Moxy #412</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">&lt; 1s</div>
                  <div class="deck-ui-stat-label">Web QR Launch</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">Direct</div>
                  <div class="deck-ui-stat-label">POS / KDS Dispatch</div>
                </div>
              </div>
              <div class="deck-ui-chips-row">
                <span class="deck-ui-token-chip">Apple / Google Pay</span>
                <span class="deck-ui-token-chip">Room Charge Billing</span>
                <span class="deck-ui-token-chip">Encrypted Tokens</span>
              </div>
            </div>
          `
        },
        {
          num: "SLIDE 04 / 04",
          heading: "Hospitality Adoption & Guest Impact",
          desc: "Transformed guest room service into a delightful, 24/7 self-service amenity while boosting food & beverage revenue for partner hotel properties.",
          points: [
            "Order Volume: Processed over 45,000 guest food orders with zero staff intervention.",
            "Guest Delight: Rated 4.8/5 by guests for convenience and novel voice interaction.",
            "Staff Relief: Reduced front-desk and room service phone calls by 60%."
          ],
          metrics: [
            { num: "45,000+", label: "Orders Processed" },
            { num: "60%", label: "Fewer Phone Calls" }
          ],
          image: "/assets/images/in-room-qr.png",
          previewHtml: `
            <div class="deck-ui-card">
              <div class="deck-ui-card-header">
                <div class="deck-ui-card-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                  Marriott Moxy Live Scale
                </div>
                <span class="deck-ui-badge-live">45,000+ Orders</span>
              </div>
              <div class="deck-ui-stat-grid">
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">45,000+</div>
                  <div class="deck-ui-stat-label">Guest Orders</div>
                </div>
                <div class="deck-ui-stat-box">
                  <div class="deck-ui-stat-val">-60%</div>
                  <div class="deck-ui-stat-label">Front-Desk Calls</div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Guest Satisfaction Rating</span>
                  <span>4.8 / 5.0 ★★★★★</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 96%; background: #f59e0b;"></div>
                </div>
              </div>
              <div class="deck-ui-progress-item">
                <div class="deck-ui-progress-label">
                  <span>Order Speed Advantage</span>
                  <span>3x Faster</span>
                </div>
                <div class="deck-ui-progress-track">
                  <div class="deck-ui-progress-fill" style="width: 88%;"></div>
                </div>
              </div>
            </div>
          `
        }
      ]
    }
  };

  const deckModal = document.getElementById('deck-modal');
  const deckCloseBtn = document.getElementById('deck-close-btn');
  const deckCompanyTag = document.getElementById('deck-company-tag');
  const deckTitle = document.getElementById('deck-modal-title');
  const deckFigmaBtn = document.getElementById('deck-figma-btn');
  const deckSlidesViewport = document.getElementById('deck-slides-viewport');
  const deckPrevBtn = document.getElementById('deck-prev-btn');
  const deckNextBtn = document.getElementById('deck-next-btn');
  const deckCounter = document.getElementById('deck-counter');
  const deckDotsContainer = document.getElementById('deck-dots-container');
  const deckToggleEmbedBtn = document.getElementById('deck-toggle-embed-btn');

  let currentDeckKey = null;
  let currentSlideIndex = 0;
  let isEmbedMode = false;

  const renderDeckSlide = (index) => {
    if (!currentDeckKey || !caseDecks[currentDeckKey]) return;
    const deck = caseDecks[currentDeckKey];
    const total = deck.slides.length;
    // Bound index between 0 and total - 1
    currentSlideIndex = Math.max(0, Math.min(index, total - 1));

    if (isEmbedMode) {
      deckSlidesViewport.innerHTML = `<iframe class="deck-iframe-viewport" src="https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(deck.figmaUrl)}" allowfullscreen></iframe>`;
      if (deckCounter) deckCounter.textContent = `Figma Canvas Mode`;
      if (deckPrevBtn) { deckPrevBtn.disabled = true; deckPrevBtn.classList.add('disabled'); }
      if (deckNextBtn) { deckNextBtn.disabled = true; deckNextBtn.classList.add('disabled'); }
      return;
    }

    const slide = deck.slides[currentSlideIndex];

    const pointsHtml = slide.points.map(p => `<li>${p}</li>`).join('');
    const metricsHtml = slide.metrics ? slide.metrics.map(m => `
      <div class="metric">
        <span class="metric-num">${m.num}</span>
        <span class="metric-label">${m.label}</span>
      </div>
    `).join('') : '';

    const previewContent = slide.previewHtml
      ? slide.previewHtml
      : `<img src="${slide.image}" alt="${slide.heading} mockup preview">`;

    deckSlidesViewport.innerHTML = `
      <div class="deck-slide active">
        <div class="deck-slide-content">
          <div class="deck-slide-num">${slide.num}</div>
          <h4 class="deck-slide-heading">${slide.heading}</h4>
          <p class="deck-slide-desc">${slide.desc}</p>
          <ul class="deck-slide-points">
            ${pointsHtml}
          </ul>
          <div class="deck-slide-metrics-row">
            ${metricsHtml}
          </div>
        </div>
        <div class="deck-slide-preview">
          ${previewContent}
        </div>
      </div>
    `;

    // Ensure clean reset of viewport scroll position
    deckSlidesViewport.scrollTop = 0;
    const activeSlide = deckSlidesViewport.querySelector('.deck-slide');
    if (activeSlide) activeSlide.scrollTop = 0;

    if (deckCounter) {
      deckCounter.textContent = `Slide ${currentSlideIndex + 1} of ${total}`;
    }

    // Update prev/next button boundary states
    if (deckPrevBtn) {
      deckPrevBtn.disabled = currentSlideIndex === 0;
      deckPrevBtn.classList.toggle('disabled', currentSlideIndex === 0);
    }
    if (deckNextBtn) {
      deckNextBtn.disabled = currentSlideIndex === total - 1;
      deckNextBtn.classList.toggle('disabled', currentSlideIndex === total - 1);
    }

    if (deckDotsContainer) {
      deckDotsContainer.innerHTML = deck.slides.map((_, i) => `
        <span class="deck-dot ${i === currentSlideIndex ? 'active' : ''}" data-index="${i}"></span>
      `).join('');

      deckDotsContainer.querySelectorAll('.deck-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          const idx = parseInt(e.target.getAttribute('data-index'), 10);
          renderDeckSlide(idx);
        });
      });
    }
  };

  const openDeckModal = (deckId) => {
    if (!caseDecks[deckId]) return;
    currentDeckKey = deckId;
    currentSlideIndex = 0;
    isEmbedMode = false;

    const deck = caseDecks[deckId];
    if (deckCompanyTag) deckCompanyTag.textContent = deck.company;
    if (deckTitle) deckTitle.textContent = deck.title;
    if (deckFigmaBtn) deckFigmaBtn.href = deck.figmaUrl;
    if (deckToggleEmbedBtn) deckToggleEmbedBtn.textContent = "View Figma Embedded Canvas";

    renderDeckSlide(0);

    if (deckModal) {
      deckModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeDeckModal = () => {
    if (deckModal) {
      deckModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  document.querySelectorAll('.btn-view-deck').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const deckId = btn.getAttribute('data-deck-id');
      openDeckModal(deckId);
    });
  });

  if (deckCloseBtn) deckCloseBtn.addEventListener('click', closeDeckModal);
  if (deckPrevBtn) {
    deckPrevBtn.addEventListener('click', () => {
      if (currentSlideIndex > 0) renderDeckSlide(currentSlideIndex - 1);
    });
  }
  if (deckNextBtn) {
    deckNextBtn.addEventListener('click', () => {
      const deck = caseDecks[currentDeckKey];
      if (deck && currentSlideIndex < deck.slides.length - 1) {
        renderDeckSlide(currentSlideIndex + 1);
      }
    });
  }

  if (deckToggleEmbedBtn) {
    deckToggleEmbedBtn.addEventListener('click', () => {
      isEmbedMode = !isEmbedMode;
      deckToggleEmbedBtn.textContent = isEmbedMode ? "View Visual Slide Presentation" : "View Figma Embedded Canvas";
      renderDeckSlide(currentSlideIndex);
    });
  }

  if (deckModal) {
    deckModal.addEventListener('click', (e) => {
      if (e.target === deckModal) closeDeckModal();
    });
  }

  // Touch swipe support for mobile slide decks
  let touchStartX = 0;
  let touchEndX = 0;
  if (deckSlidesViewport) {
    deckSlidesViewport.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    deckSlidesViewport.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        const diffX = touchStartX - touchEndX;
        const deck = caseDecks[currentDeckKey];
        if (Math.abs(diffX) > 40 && deck) {
          if (diffX > 0 && currentSlideIndex < deck.slides.length - 1) {
            renderDeckSlide(currentSlideIndex + 1); // Swipe left -> next slide
          } else if (diffX < 0 && currentSlideIndex > 0) {
            renderDeckSlide(currentSlideIndex - 1); // Swipe right -> prev slide
          }
        }
      }
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (deckModal && deckModal.classList.contains('active')) {
      const deck = caseDecks[currentDeckKey];
      if (e.key === 'Escape') closeDeckModal();
      if (e.key === 'ArrowRight' && deck && currentSlideIndex < deck.slides.length - 1) {
        renderDeckSlide(currentSlideIndex + 1);
      }
      if (e.key === 'ArrowLeft' && currentSlideIndex > 0) {
        renderDeckSlide(currentSlideIndex - 1);
      }
    }
  });

})();

