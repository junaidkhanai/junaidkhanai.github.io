// ───────────────────────────────
// Neural Network Canvas Animation (Ambient Overlay)
// ───────────────────────────────
(function () {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height, nodes, mouse, animationId;
  const NODE_COUNT = 80;
  const CONNECTION_DIST = 150;
  const MOUSE_RADIUS = 200;

  mouse = { x: -1000, y: -1000 };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width * window.devicePixelRatio;
    height = canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function createNodes() {
    const dispW = width / window.devicePixelRatio;
    const dispH = height / window.devicePixelRatio;
    nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * dispW,
        y: Math.random() * dispH,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2.5 + 1,
        baseRadius: Math.random() * 2.5 + 1,
        pulseOffset: Math.random() * Math.PI * 2,
        hue: 230 + Math.random() * 40, // indigo to violet range
      });
    }
  }

  function drawNode(node, time) {
    const pulse = Math.sin(time * 0.002 + node.pulseOffset) * 0.5 + 0.5;
    const dx = mouse.x - node.x;
    const dy = mouse.y - node.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mouseFactor = dist < MOUSE_RADIUS ? 1 - dist / MOUSE_RADIUS : 0;

    node.radius = node.baseRadius + pulse * 1.5 + mouseFactor * 3;
    const alpha = 0.4 + pulse * 0.3 + mouseFactor * 0.3;

    // Outer glow
    const gradient = ctx.createRadialGradient(
      node.x, node.y, 0,
      node.x, node.y, node.radius * 4
    );
    gradient.addColorStop(0, `hsla(${node.hue}, 80%, 70%, ${alpha * 0.6})`);
    gradient.addColorStop(1, `hsla(${node.hue}, 80%, 70%, 0)`);
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${node.hue}, 80%, 75%, ${alpha})`;
    ctx.fill();
  }

  function drawConnections(time) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.25;

          // Check if connection is near mouse for highlight
          const midX = (nodes[i].x + nodes[j].x) / 2;
          const midY = (nodes[i].y + nodes[j].y) / 2;
          const mouseDist = Math.sqrt((mouse.x - midX) ** 2 + (mouse.y - midY) ** 2);
          const mouseBoost = mouseDist < MOUSE_RADIUS ? (1 - mouseDist / MOUSE_RADIUS) * 0.4 : 0;

          // Animated dash for data flow effect
          const dashPulse = Math.sin(time * 0.003 + i + j) * 0.5 + 0.5;

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `hsla(240, 70%, 70%, ${alpha + mouseBoost})`;
          ctx.lineWidth = 0.5 + mouseBoost * 2 + dashPulse * 0.3;
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseGlow() {
    if (mouse.x < 0) return;
    const gradient = ctx.createRadialGradient(
      mouse.x, mouse.y, 0,
      mouse.x, mouse.y, MOUSE_RADIUS
    );
    gradient.addColorStop(0, 'hsla(250, 80%, 65%, 0.08)');
    gradient.addColorStop(1, 'hsla(250, 80%, 65%, 0)');
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  function update() {
    const dispW = width / window.devicePixelRatio;
    const dispH = height / window.devicePixelRatio;

    nodes.forEach(node => {
      // Drift
      node.x += node.vx;
      node.y += node.vy;

      // Mouse repel/attract
      const dx = mouse.x - node.x;
      const dy = mouse.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS && dist > 0) {
        const force = (1 - dist / MOUSE_RADIUS) * 0.02;
        node.vx += dx * force;
        node.vy += dy * force;
      }

      // Damping
      node.vx *= 0.99;
      node.vy *= 0.99;

      // Bounds wrap
      if (node.x < -20) node.x = dispW + 20;
      if (node.x > dispW + 20) node.x = -20;
      if (node.y < -20) node.y = dispH + 20;
      if (node.y > dispH + 20) node.y = -20;
    });
  }

  function animate(time) {
    const dispW = width / window.devicePixelRatio;
    const dispH = height / window.devicePixelRatio;

    ctx.clearRect(0, 0, dispW, dispH);

    drawMouseGlow();
    drawConnections(time);
    nodes.forEach(node => drawNode(node, time));
    update();

    animationId = requestAnimationFrame(animate);
  }

  function init() {
    resize();
    createNodes();
    animate(0);
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animationId);
    resize();
    createNodes();
    animate(0);
  });

  init();
})();

// ───────────────────────────────
// Cursor Glow
// ───────────────────────────────
const cursorGlow = document.getElementById('cursorGlow');

document.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top = e.clientY + 'px';
  cursorGlow.style.opacity = '1';
});

document.addEventListener('mouseleave', () => {
  cursorGlow.style.opacity = '0';
});

// ───────────────────────────────
// Navbar scroll effect
// ───────────────────────────────
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ───────────────────────────────
// Mobile Menu
// ───────────────────────────────
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');

navToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
  navToggle.classList.toggle('active');
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    navToggle.classList.remove('active');
  });
});

// ───────────────────────────────
// Scroll Reveal
// ───────────────────────────────
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      // Stagger animations within the same parent
      const siblings = entry.target.parentElement.querySelectorAll('.reveal');
      let delay = 0;
      siblings.forEach((sib, i) => {
        if (sib === entry.target) delay = i * 80;
      });

      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);

      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

// ───────────────────────────────
// Counter Animation
// ───────────────────────────────
const counters = document.querySelectorAll('.stat-number');

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const target = parseInt(entry.target.getAttribute('data-count'));
      let current = 0;
      const duration = 1500;
      const step = target / (duration / 16);

      const update = () => {
        current += step;
        if (current >= target) {
          entry.target.textContent = target;
        } else {
          entry.target.textContent = Math.floor(current);
          requestAnimationFrame(update);
        }
      };

      update();
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

counters.forEach(c => counterObserver.observe(c));

// ───────────────────────────────
// Smooth scroll for anchor links
// ───────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ───────────────────────────────
// Contact Form → Google Sheets
// ───────────────────────────────
const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('formSubmit');
  const originalText = btn.innerHTML;

  btn.innerHTML = 'Sending...';
  btn.disabled = true;

  const payload = {
    name: document.getElementById('formName').value,
    email: document.getElementById('formEmail').value,
    message: document.getElementById('formMessage').value
  };

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    btn.innerHTML = '✓ Message Sent!';
    btn.style.background = '#34d399';
    contactForm.reset();
  } catch (err) {
    btn.innerHTML = '✗ Failed. Try again.';
    btn.style.background = '#ef4444';
  }

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
    btn.disabled = false;
  }, 2500);
});
