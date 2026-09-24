/* ============================================================
   1. ЭКРАНЫ
   ============================================================ */
const screenStart = document.getElementById('screen-start');
const screenClick = document.getElementById('screen-click');
const screenFinal = document.getElementById('screen-final');
const startBtn    = document.getElementById('start-btn');
const smallHeart  = document.getElementById('small-heart');
const counterEl   = document.getElementById('counter');
const heartEl     = document.getElementById('heart');
const timerEl     = document.getElementById('timer');

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

startBtn.addEventListener('click', () => {
    showScreen(screenClick);
});

let clicks = 0;
smallHeart.addEventListener('click', () => {
    clicks++;
    counterEl.textContent = `Кликов: ${clicks} / 3`;

    smallHeart.style.transform = 'scale(1.15)';
    setTimeout(() => { smallHeart.style.transform = ''; }, 120);

    if (clicks >= 3) {
        setTimeout(() => {
            showScreen(screenFinal);
            startHeartAnimation();
            startTimer();
        }, 400);
    }
});

/* ============================================================
   2. 3D ASCII-СЕРДЦЕ
   ============================================================ */
function heartPoint(t) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t);
    return { x, y };
}

const WIDTH = 80;
const HEIGHT = 40;
const SCALE_X = 2.2;
const SCALE_Y = 1.1;
const CHARS = [' ', '.', ',', ':', ';', '+', '*', '?', '%', 'S', '#', '@'];

let angle = 0;
let animating = false;

function render() {
    const buffer = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(' '));
    const zBuffer = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(-Infinity));

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const steps = 300;

    for (let layer = 0; layer < 5; layer++) {
        const shrink = 1 - layer * 0.12;
        for (let i = 0; i < steps; i++) {
            const t = (i / steps) * Math.PI * 2;
            const { x, y } = heartPoint(t);

            const xIn = x * shrink;
            const yIn = y * shrink;

            const x3d = xIn * cosA;
            const z3d = xIn * sinA;

            const screenX = Math.floor(x3d * SCALE_X + WIDTH / 2);
            const screenY = Math.floor(-yIn * SCALE_Y + HEIGHT / 2);

            if (screenX >= 0 && screenX < WIDTH &&
                screenY >= 0 && screenY < HEIGHT) {
                if (z3d > zBuffer[screenY][screenX]) {
                    zBuffer[screenY][screenX] = z3d;
                    const brightness = (z3d + 16) / 32;
                    const idx = Math.min(
                        CHARS.length - 1,
                        Math.max(0, Math.floor(brightness * CHARS.length))
                    );
                    buffer[screenY][screenX] = CHARS[idx];
                }
            }
        }
    }

    heartEl.textContent = buffer.map(r => r.join('')).join('\n');
}

function animate() {
    if (!animating) return;
    angle += 0.03;
    render();
    requestAnimationFrame(animate);
}

function startHeartAnimation() {
    if (animating) return;
    animating = true;
    animate();
}

/* ============================================================
   3. ТАЙМЕР «МЫ ВМЕСТЕ»
   ============================================================ */
// ⚠️ ИЗМЕНИ ДАТУ ЗДЕСЬ (год, месяц-1, день)
// В JS месяц считается с 0: 0 = январь, 4 = май
const START_DATE = new Date(2026, 4, 12, 0, 0, 0); // 12 мая 2026

function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

function updateTimer() {
    const now = new Date();
    let diff = now - START_DATE;
    let prefix;

    if (diff >= 0) {
        prefix = 'Мы вместе уже:';
    } else {
        diff = -diff;
        prefix = 'До нашей встречи осталось:';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days    = Math.floor(totalSeconds / 86400);
    const hours   = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const daysText  = `${days} ${plural(days, 'день', 'дня', 'дней')}`;
    const hoursText = `${hours} ${plural(hours, 'час', 'часа', 'часов')}`;
    const minText   = `${minutes} ${plural(minutes, 'минута', 'минуты', 'минут')}`;
    const secText   = `${seconds} ${plural(seconds, 'секунда', 'секунды', 'секунд')}`;

    timerEl.textContent = `${prefix} ${daysText}, ${hoursText}, ${minText}, ${secText}`;
}

let timerInterval = null;
function startTimer() {
    if (timerInterval) return;
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

/* ============================================================
   4. ЧАСТИЦЫ НА ФОНЕ (летящие сердечки)
   ============================================================ */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const PARTICLE_CHARS = ['❤', '♥', '♡', '·', '✦'];
const PARTICLE_COUNT = 45;
const particles = [];

function createParticle(randomY = true) {
    return {
        x: Math.random() * canvas.width,
        y: randomY ? Math.random() * canvas.height : canvas.height + 20,
        size: 8 + Math.random() * 14,
        speedY: 0.3 + Math.random() * 0.8,
        driftX: (Math.random() - 0.5) * 0.4,
        alpha: 0.15 + Math.random() * 0.35,
        char: PARTICLE_CHARS[Math.floor(Math.random() * PARTICLE_CHARS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
    };
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(createParticle());
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `rgba(179, 86, 122, ${p.alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();

        // Обновление позиции
        p.y -= p.speedY;
        p.x += p.driftX;
        p.rotation += p.rotSpeed;

        // Если улетела вверх — вернуть снизу
        if (p.y < -30) {
            particles[i] = createParticle(false);
        }
    }

    requestAnimationFrame(drawParticles);
}
drawParticles();

/* ============================================================
   5. СМЕНА СЦЕН ПО ВРЕМЕНИ СУТОК
   ============================================================ */
const SCENES = {
    morning: {
        // 5:00–11:59 — нежное утро
        bg: 'radial-gradient(circle at center, #2b1d24 0%, #12080d 100%)',
        heartColor: '#c98ba0',
        textColor: '#e8d5dc',
    },
    day: {
        // 12:00–17:59 — тёплый день
        bg: 'radial-gradient(circle at center, #241826 0%, #0e070f 100%)',
        heartColor: '#b3567a',
        textColor: '#d8c4dc',
    },
    evening: {
        // 18:00–22:59 — фиолетовый вечер
        bg: 'radial-gradient(circle at center, #1f1028 0%, #0a0510 100%)',
        heartColor: '#a05a8e',
        textColor: '#cbb0d2',
    },
    night: {
        // 23:00–4:59 — глубокая ночь
        bg: 'radial-gradient(circle at center, #14091a 0%, #050208 100%)',
        heartColor: '#8d4a72',
        textColor: '#b8a3c2',
    },
};

function applyScene() {
    const h = new Date().getHours();
    let scene;
    if (h >= 5 && h < 12)       scene = SCENES.morning;
    else if (h >= 12 && h < 18) scene = SCENES.day;
    else if (h >= 18 && h < 23) scene = SCENES.evening;
    else                        scene = SCENES.night;

    document.body.style.background = scene.bg;
    heartEl.style.color = scene.heartColor;
    document.querySelector('.love-text').style.color = scene.textColor;
}

applyScene();
// Обновляем сцену каждую минуту (если сайт открыт долго)
setInterval(applyScene, 60 * 1000);