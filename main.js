/* main.js - Mahima Gupta Portfolio Interactive Script */

(function() {
  'use strict';

  // 1. CUSTOM CURSOR
  const cursor = document.getElementById('cursor');
  const interactives = 'a, button, .hero-face, .project-card, .insight-card, .hamburger, .pw-close, .contact-close';

  if (cursor) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor interpolation
    const tickCursor = () => {
      const ease = 0.15;
      cursorX += (mouseX - cursorX) * ease;
      cursorY += (mouseY - cursorY) * ease;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
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

  // 2. HERO PARALLAX & CURSOR EYE/HEAD TRACKING
  const emojiLayer = document.getElementById('hero-emoji-layer');
  const avatarBtn = document.getElementById('hero-avatar-btn');
  const heroSection = document.getElementById('hero-section');
  const avatarBob = emojiLayer ? emojiLayer.querySelector('.avatar-bob') : null;

  if (emojiLayer && heroSection) {
    const MAX_BLUR = 12;
    const emojis = emojiLayer.querySelectorAll('.fe, .hero-face');

    // Track mouse coordinates
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let curRotX = 0;
    let curRotY = 0;
    let isHovered = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    const updateHeroParallax = () => {
      const scrollY = window.scrollY;
      const heroHeight = heroSection.offsetHeight;
      const windowHeight = window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const workEl = document.getElementById('work');

      // Gradual blur and opacity fade
      const blurStart = heroHeight * 0.1;
      const blurEnd = workEl ? workEl.offsetTop - windowHeight * 0.05 : heroHeight;
      
      let progress = 0;
      if (scrollY > blurStart) {
        progress = Math.min((scrollY - blurStart) / Math.max(blurEnd - blurStart, 1), 1);
      }

      const blurVal = progress * MAX_BLUR;
      const opacityVal = 1 - progress * 0.65;

      emojis.forEach(el => {
        // Individual Parallax factor calculation based on depth classes
        let speed = 0.35; // default mid factor
        if (el.classList.contains('near')) {
          speed = 0.55;
        } else if (el.classList.contains('far')) {
          speed = 0.18;
        } else if (el.classList.contains('hero-face')) {
          speed = isMobile ? 0.08 : 0.25;
        }

        const translateVal = -(scrollY * speed);

        // Apply translations
        if (el.classList.contains('hero-face')) {
          el.style.transform = `translate3d(-50%, ${translateVal.toFixed(1)}px, 0)`;
        } else {
          el.style.transform = `translate3d(0, ${translateVal.toFixed(1)}px, 0)`;
        }

        // Keep the main avatar crisp while the decorative emojis soften on scroll.
        if (el.classList.contains('hero-face')) {
          el.style.removeProperty('filter');
          el.style.opacity = (1 - progress * (isMobile ? 0.12 : 0.35)).toFixed(3);
        } else {
          el.style.filter = blurVal > 0.4 ? `blur(${blurVal.toFixed(1)}px)` : '';
          el.style.opacity = opacityVal.toFixed(3);
        }
      });
    };

    // 3D head-tracking frame tick
    const tickTracking = () => {
      if (avatarBob) {
        const rect = avatarBob.getBoundingClientRect();
        const avatarCenterX = rect.left + rect.width / 2;
        const avatarCenterY = rect.top + rect.height / 2;

        const dx = mouseX - avatarCenterX;
        const dy = mouseY - avatarCenterY;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(window.innerWidth, window.innerHeight);
        const intensity = Math.min(distance / (maxDist * 0.35), 1.0); // full tilt at 35% distance

        // Calculate pitch (rotX) and yaw (rotY) angles
        const targetX = -(dy / Math.max(distance, 1)) * intensity * 14; // max 14deg tilt
        const targetY = (dx / Math.max(distance, 1)) * intensity * 16;  // max 16deg rotate

        // Smooth ease interpolation
        const easeFactor = 0.12;
        curRotX += (targetX - curRotX) * easeFactor;
        curRotY += (targetY - curRotY) * easeFactor;

        // Leaning drift offset
        const driftX = curRotY * 0.32;
        const driftY = -curRotX * 0.32;
        
        const scaleVal = isHovered ? 1.05 : 1.0;

        avatarBob.style.transform = `perspective(800px) rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg) translate3d(${driftX.toFixed(1)}px, ${driftY.toFixed(1)}px, 0) scale(${scaleVal})`;
      }
      requestAnimationFrame(tickTracking);
    };

    window.addEventListener('scroll', updateHeroParallax, { passive: true });
    window.addEventListener('resize', updateHeroParallax);

    // Hover listeners
    if (avatarBtn) {
      avatarBtn.addEventListener('mouseenter', () => {
        emojiLayer.classList.add('face-hover');
        isHovered = true;
      });
      avatarBtn.addEventListener('mouseleave', () => {
        emojiLayer.classList.remove('face-hover');
        isHovered = false;
      });
    }

    updateHeroParallax();
    tickTracking();
  }

  // 3. UNDULATING CANVAS GROW LINE
  const canvas = document.getElementById('grow-line-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0;

    const resizeCanvas = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      drawGrowLine();
    };
    window.addEventListener('resize', resizeCanvas);

    // Dynamic wave coordinate list generator
    const generateWavePoints = () => {
      const points = [];
      const density = 100;
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        const x = t * W;
        const y = H * (0.45 
                  + Math.sin(t * Math.PI * 2.8) * 0.08 
                  + Math.sin(t * Math.PI * 5.2 + 0.8) * 0.03);
        points.push({ x, y });
      }
      return points;
    };

    let headProgress = 0;
    let tailProgress = 0;

    const drawGrowLine = () => {
      ctx.clearRect(0, 0, W, H);
      if (headProgress <= 0 && tailProgress <= 0) return;

      const headX = Math.min(headProgress * W * 1.08, W);
      const tailX = Math.max(0, tailProgress * W * 1.14 - W * 0.08);

      if (headX - tailX < 2) return;

      const points = generateWavePoints();
      const grad = ctx.createLinearGradient(0, 0, W, 0);

      const tFrac = tailX / W;
      const hFrac = headX / W;
      const margin = 0.02; // soft border sweep

      // Get dynamic accent colors from theme variables
      const rootStyles = getComputedStyle(document.documentElement);
      const accentColor1 = rootStyles.getPropertyValue('--accent').trim() || '#1a6fff';
      const accentColor2 = rootStyles.getPropertyValue('--accent2').trim() || '#4f3fd9';

      if (tFrac > margin) grad.addColorStop(Math.max(0, tFrac - margin), 'rgba(0, 0, 0, 0)');
      grad.addColorStop(Math.min(1, tFrac + margin), accentColor1);
      grad.addColorStop(Math.min(1, tFrac + (hFrac - tFrac) * 0.5), accentColor2);
      grad.addColorStop(Math.max(0, hFrac - margin), accentColor1);
      if (hFrac < 1 - margin) grad.addColorStop(Math.min(1, hFrac + margin), 'rgba(0, 0, 0, 0)');

      const traceWave = () => {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const mx = (points[i-1].x + points[i].x) / 2;
          const my = (points[i-1].y + points[i].y) / 2;
          ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, mx, my);
        }
      };

      ctx.save();
      
      // Soft UI signal rail rather than a heavy decorative wave.
      ctx.filter = 'blur(16px)';
      ctx.globalAlpha = 0.14;
      traceWave();
      ctx.strokeStyle = grad;
      ctx.lineWidth = 30;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      [-14, 0, 14].forEach((offset, index) => {
        ctx.save();
        ctx.translate(0, offset);
        ctx.filter = 'none';
        ctx.globalAlpha = index === 1 ? 0.62 : 0.25;
        traceWave();
        ctx.strokeStyle = grad;
        ctx.lineWidth = index === 1 ? 3 : 1;
        ctx.stroke();
        ctx.restore();
      });

      // Interface nodes make the animated rail feel like a product-system map.
      const nodeIndexes = [18, 42, 68, 88];
      nodeIndexes.forEach((pointIndex, index) => {
        const point = points[pointIndex];
        if (!point || point.x < tailX || point.x > headX) return;

        ctx.beginPath();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = index % 2 === 0 ? accentColor1 : accentColor2;
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = index % 2 === 0 ? accentColor1 : accentColor2;
        ctx.lineWidth = 1;
        ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      });

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

  // 5. PASSWORD PROTECTED STUDIES
  const pwOverlay = document.getElementById('pw-overlay');
  const pwInputField = document.getElementById('pw-input-field');
  const pwSubmitBtn = document.getElementById('pw-submit-btn');
  const pwCloseBtn = document.getElementById('pw-close-btn');
  const pwErrorMsg = document.getElementById('pw-error-msg');
  const SESSION_KEY = 'mgupta_unlocked';
  let targetURL = '';

  const openUnlockModal = (url) => {
    targetURL = url;
    pwInputField.value = '';
    pwErrorMsg.style.display = 'none';
    pwInputField.style.borderColor = '';
    pwInputField.style.boxShadow = '';
    pwOverlay.classList.add('active');
    setTimeout(() => pwInputField.focus(), 100);
  };

  const closeUnlockModal = () => {
    pwOverlay.classList.remove('active');
  };

  const triggerVerification = () => {
    const code = pwInputField.value.trim().toLowerCase();
    
    // Check password 'mgupta'
    if (code === 'mgupta') {
      sessionStorage.setItem(SESSION_KEY, '1');
      closeUnlockModal();
      window.open(targetURL, '_blank');
    } else {
      pwErrorMsg.style.display = 'block';
      pwInputField.style.borderColor = '#d93838';
      pwInputField.style.boxShadow = '0 0 0 3px rgba(217, 56, 56, 0.15)';
      
      // Quick shake effect
      pwInputField.animate([
        { transform: 'translateX(0px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(0px)' }
      ], {
        duration: 350,
        easing: 'ease-in-out'
      });
    }
  };

  // Bind password clicks
  document.querySelectorAll('[data-pw="true"]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const url = card.getAttribute('href');
      
      // If already unlocked, open direct URL
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        window.open(url, '_blank');
      } else {
        openUnlockModal(url);
      }
    });
  });

  if (pwCloseBtn) pwCloseBtn.addEventListener('click', closeUnlockModal);
  if (pwOverlay) {
    pwOverlay.addEventListener('click', (e) => {
      if (e.target === pwOverlay) closeUnlockModal();
    });
  }

  if (pwSubmitBtn) pwSubmitBtn.addEventListener('click', triggerVerification);
  if (pwInputField) {
    pwInputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') triggerVerification();
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
      closeUnlockModal();
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

  // Click handlers
  pickers.forEach(picker => {
    picker.addEventListener('click', (e) => {
      const dot = e.target.closest('.accent-dot');
      if (dot) {
        applyAccent(dot.dataset.accent);
      }
    });
  });

})();
