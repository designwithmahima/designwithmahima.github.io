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

})();
