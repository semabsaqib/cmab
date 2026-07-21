const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ PAGE LOADER ============ */
(function () {
    const loader = document.getElementById('pageLoader');
    if (!loader) return;
    if (reduceMotion) { loader.remove(); return; }
    const countEl = document.getElementById('pageLoaderCount');
    const fillEl = document.getElementById('pageLoaderFill');
    const dur = 900;
    const start = performance.now();
    function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const pct = Math.round(eased * 100);
        if (countEl) countEl.textContent = pct + '%';
        if (fillEl) fillEl.style.width = pct + '%';
        if (t < 1) {
            requestAnimationFrame(tick);
        } else {
            loader.classList.add('done');
            setTimeout(() => loader.remove(), 700);
        }
    }
    requestAnimationFrame(tick);
})();

/* ============ HEADING WORD REVEAL ============ */
(function () {
    if (reduceMotion) return;
    function wrapWords(node) {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
                const words = child.textContent.split(/(\s+)/).filter(w => w.length);
                const frag = document.createDocumentFragment();
                words.forEach(w => {
                    if (/^\s+$/.test(w)) {
                        frag.appendChild(document.createTextNode(w));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'rw';
                        span.textContent = w;
                        frag.appendChild(span);
                    }
                });
                node.replaceChild(frag, child);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                wrapWords(child);
            }
        });
    }
    document.querySelectorAll('.section-header h2, .flagship h2').forEach(h => {
        wrapWords(h);
        h.querySelectorAll('.rw').forEach((span, i) => {
            span.style.transitionDelay = (i * 40) + 'ms';
        });
    });
})();

/* ============ INTERACTIVE PARTICLE FIELD ============ */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
let W, H, DPR;

function sizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
sizeCanvas();

const COLORS = [[255,45,120],[124,58,237],[0,212,255]];
const COUNT = Math.min(70, Math.floor(W * H / 22000));
const particles = [];
for (let i = 0; i < COUNT; i++) {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)];
    particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.6,
        opacity: Math.random() * 0.5 + 0.15,
        c
    });
}

const mouse = { x: -9999, y: -9999, active: false };
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
window.addEventListener('mouseout', () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

// Subtle parallax offset driven by pointer
let parX = 0, parY = 0;
window.addEventListener('mousemove', e => {
    parX = (e.clientX / W - 0.5) * 20;
    parY = (e.clientY / H - 0.5) * 20;
});

function animate() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
        // mouse repulsion
        if (mouse.active) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < 14000) {
                const d = Math.sqrt(d2) || 1;
                const force = (120 - d) / 120;
                p.vx += (dx / d) * force * 0.6;
                p.vy += (dy / d) * force * 0.6;
            }
        }
        p.x += p.vx; p.y += p.vy;
        // friction + gentle drift restore
        p.vx *= 0.96; p.vy *= 0.96;
        p.vx += (Math.random() - 0.5) * 0.02;
        p.vy += (Math.random() - 0.5) * 0.02;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }

        const px = p.x + parX * (p.size / 2), py = p.y + parY * (p.size / 2);
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${p.opacity})`;
        ctx.fill();
    }
    // connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 140) {
                const alpha = 0.09 * (1 - dist/140);
                ctx.beginPath();
                ctx.moveTo(a.x + parX*(a.size/2), a.y + parY*(a.size/2));
                ctx.lineTo(b.x + parX*(b.size/2), b.y + parY*(b.size/2));
                ctx.strokeStyle = `rgba(${a.c[0]},${a.c[1]},${a.c[2]},${alpha})`;
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}
if (!reduceMotion) animate();

let resizeT;
window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(sizeCanvas, 150);
});

/* ============ NAV SCROLL + PROGRESS BAR ============ */
const nav = document.querySelector('nav');
const progress = document.getElementById('scrollProgress');
const toTop = document.getElementById('toTop');
function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 50);
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', y > 600);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();
if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ============ MOBILE NAV TOGGLE ============ */
(function () {
    const navToggle = document.getElementById('navToggle');
    const navBackdrop = document.getElementById('navBackdrop');
    if (!nav || !navToggle) return;

    function openMenu() {
        nav.classList.add('nav-open');
        navToggle.setAttribute('aria-expanded', 'true');
        if (navBackdrop) {
            navBackdrop.classList.add('show');
            requestAnimationFrame(() => navBackdrop.classList.add('visible'));
        }
        document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
        nav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        if (navBackdrop) {
            navBackdrop.classList.remove('visible');
            setTimeout(() => navBackdrop.classList.remove('show'), 350);
        }
        document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', () => {
        nav.classList.contains('nav-open') ? closeMenu() : openMenu();
    });
    if (navBackdrop) navBackdrop.addEventListener('click', closeMenu);
    document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeMenu));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 768) closeMenu(); });
})();

/* ============ SCROLL REVEAL + STAGGER ============ */
const revealSel = '.fade-in, .reveal-left, .reveal-right, .reveal-scale, .stagger, .section-header, .testimonial-card, .cta-box';
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            el.classList.add('visible');
            // stagger children
            if (el.classList.contains('stagger')) {
                Array.from(el.children).forEach((child, i) => {
                    child.style.transitionDelay = (i * 90) + 'ms';
                });
            }
            // fire counters inside
            el.querySelectorAll('.stat-num[data-target]').forEach(runCounter);
            observer.unobserve(el);
        }
    });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(revealSel).forEach(el => observer.observe(el));

/* ============ ANIMATED COUNTERS ============ */
function runCounter(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const dur = 1600;
    const start = performance.now();
    function tick(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        const val = Math.round(target * eased);
        el.textContent = val + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
}

/* ============ 3D TILT ON CARDS ============ */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.skill-card, .service-card, .rt-col, .ev-card, .rt-eng').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const rx = (e.clientX - r.left) / r.width;
            const ry = (e.clientY - r.top) / r.height;
            const px = rx - 0.5;
            const py = ry - 0.5;
            card.style.transform =
                `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-8px)`;
            card.style.setProperty('--mx', (rx * 100) + '%');
            card.style.setProperty('--my', (ry * 100) + '%');
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

/* ============ MAGNETIC BUTTONS ============ */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const r = btn.getBoundingClientRect();
            const mx = e.clientX - r.left - r.width / 2;
            const my = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${mx * 0.18}px, ${my * 0.28}px) translateY(-3px)`;
        });
        btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
}

/* ============ GLOBAL CURSOR SPOTLIGHT ============ */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const glow = document.createElement('div');
    glow.id = 'cursorGlow';
    document.body.appendChild(glow);
    let glowOn = false;
    window.addEventListener('mousemove', e => {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
        if (!glowOn) { glow.classList.add('on'); glowOn = true; }
    }, { passive: true });
    window.addEventListener('mouseout', () => { glow.classList.remove('on'); glowOn = false; });
}

/* ============ CURSOR TAG — contextual label on [data-cursor] elements ============ */
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    const tag = document.createElement('div');
    tag.className = 'cursor-tag';
    document.body.appendChild(tag);
    let tagShown = false;
    window.addEventListener('mousemove', e => {
        tag.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%) scale(${tagShown ? 1 : 0.6})`;
    }, { passive: true });
    document.querySelectorAll('[data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
            tagShown = true;
            tag.textContent = el.getAttribute('data-cursor');
            tag.classList.add('show');
        });
        el.addEventListener('mouseleave', () => {
            tagShown = false;
            tag.classList.remove('show');
        });
    });
}

/* ============ BUTTON CLICK RIPPLE ============ */
if (!reduceMotion) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const r = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const size = Math.max(r.width, r.height) * 1.6;
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
            btn.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        });
    });
}

/* ============ HERO HEADLINE CURSOR ============ */
const line2 = document.querySelector('.hero h1 .line2');
if (line2 && !reduceMotion) {
    setTimeout(() => {
        const cur = document.createElement('span');
        cur.className = 'type-cursor';
        line2.appendChild(cur);
    }, 1300);
}

/* ============ SUBTITLE PER-WORD REVEAL ============ */
const subtitle = document.querySelector('.hero-subtitle');
if (subtitle && !reduceMotion) {
    const words = subtitle.textContent.trim().split(/\s+/);
    subtitle.innerHTML = words
        .map((w, i) => `<span class="w" style="animation-delay:${(1.0 + i * 0.045).toFixed(3)}s">${w}</span>`)
        .join(' ');
}

/* ============ HEADLINE DECRYPT SCRAMBLE ============ */
(function () {
    if (reduceMotion) return;
    const chars = '!<>-_\\/[]{}—=+*^?#01010111abcdef';
    function scramble(el, delay) {
        const finalText = el.textContent;
        el.classList.add('scramble');
        let frame = 0;
        const totalFrames = finalText.length * 3 + 24;
        const start = performance.now() + delay;
        function run(now) {
            if (now < start) { requestAnimationFrame(run); return; }
            const progress = frame / totalFrames;
            let out = '';
            for (let i = 0; i < finalText.length; i++) {
                if (finalText[i] === ' ') { out += ' '; continue; }
                const revealPoint = i / finalText.length;
                if (progress > revealPoint) {
                    out += finalText[i];
                } else {
                    out += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            el.textContent = out;
            frame++;
            if (frame <= totalFrames) requestAnimationFrame(run);
            else el.textContent = finalText;
        }
        requestAnimationFrame(run);
    }
    const l1 = document.querySelector('.hero h1 .line1');
    const l2 = document.querySelector('.hero h1 .line2');
    if (l1) scramble(l1, 250);
    if (l2) scramble(l2, 550);
})();

/* ============ TERMINAL: TYPE COMMAND + REVEAL OUTPUT ============ */
(function () {
    const cmdEl = document.querySelector('.trusted-cmd .cmd');
    const outEl = document.querySelector('.trusted-output');
    if (!cmdEl || !outEl) return;
    const fullCmd = cmdEl.textContent;
    const tags = Array.from(outEl.children);

    if (reduceMotion) return; // leave static, fully visible

    // hide output tags initially
    tags.forEach(t => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; });
    cmdEl.textContent = '';

    const startDelay = 1700; // after the terminal boots in
    let i = 0;
    function typeChar() {
        if (i <= fullCmd.length) {
            cmdEl.textContent = fullCmd.slice(0, i);
            i++;
            setTimeout(typeChar, 45 + Math.random() * 40);
        } else {
            // reveal output tags one by one
            tags.forEach((t, k) => {
                setTimeout(() => {
                    t.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)';
                    t.style.opacity = '1';
                    t.style.transform = 'translateY(0)';
                }, 180 + k * 130);
            });
        }
    }
    setTimeout(typeChar, startDelay);
})();

/* ============ SMOOTH ANCHOR SCROLL ============ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const id = a.getAttribute('href');
        if (id.length > 1) {
            const t = document.querySelector(id);
            if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        }
    });
});
