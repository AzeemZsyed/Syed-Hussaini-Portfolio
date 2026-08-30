// ── Stars ──────────────────────────────────────────────
function createStars(count, size, duration) {
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: ${size}px;
        height: ${size}px;
        background: transparent;
        animation: animStar ${duration}s linear infinite;
        pointer-events: none;
        z-index: 0;
    `;
    const shadows = [];
    for (let i = 0; i < count; i++) {
        const x = Math.floor(Math.random() * 2000);
        const y = Math.floor(Math.random() * 2000);
        shadows.push(`${x}px ${y}px #FFF`);
    }
    el.style.boxShadow = shadows.join(', ');
    document.body.appendChild(el);
}

const starStyle = document.createElement('style');
starStyle.textContent = `
    @keyframes animStar {
        from { transform: translateY(0px); }
        to   { transform: translateY(-2000px); }
    }
    @media (prefers-reduced-motion: reduce) {
        [style*="animStar"] { animation: none !important; }
    }
`;
document.head.appendChild(starStyle);

createStars(700, 1, 50);
createStars(200, 2, 100);
createStars(100, 3, 150);

// ── Active nav link highlight ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.MenuBar ul li a').forEach(a => {
        if (a.getAttribute('href').toLowerCase() === page) {
            a.style.color = '#fff';
        }
    });
});