const CanavaView = document.getElementById('CanavaView');
const ctx = CanavaView.getContext('2d');

let particles = [];
let w, h;
let speedMultiplier = 10;
let particleSize = 130;
let particleOpacity = 0.1;
let colorHue = 190;
let animationId = null;
let isAnimating = false;

function resize() {
    w = CanavaView.width = window.innerWidth;
    h = CanavaView.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.targetSize = particleSize + Math.random() * 100;
        this.size = this.targetSize;
        this.baseSpeedX = (Math.random() - 0.5) * 0.5;
        this.baseSpeedY = (Math.random() - 0.5) * 0.5;
        this.baseOpacity = particleOpacity;
        this.hue = colorHue + Math.random() * 15;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.baseSpeedX * speedMultiplier;
        this.y += this.baseSpeedY * speedMultiplier;

        if (this.x < -this.size) this.x = w + this.size;
        if (this.x > w + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = h + this.size;
        if (this.y > h + this.size) this.y = -this.size;

        if (Math.random() < 0.01) {
            this.baseSpeedX += (Math.random() - 0.5) * 0.1;
            this.baseSpeedY += (Math.random() - 0.5) * 0.1;
            
            this.baseSpeedX = Math.max(-0.8, Math.min(0.8, this.baseSpeedX));
            this.baseSpeedY = Math.max(-0.8, Math.min(0.8, this.baseSpeedY));
        }

        this.size += (this.targetSize - this.size) * 0.05;
        this.pulseOffset += 0.02;
    }

    draw() {
        const pulse = Math.sin(this.pulseOffset) * 0.15 + 1;
        const currentSize = this.size * pulse;
        const currentOpacity = this.baseOpacity * pulse;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, currentSize
        );
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 65%, ${currentOpacity})`);
        gradient.addColorStop(0.4, `hsla(${this.hue}, 100%, 60%, ${currentOpacity * 0.7})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 100%, 55%, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.x - currentSize,
            this.y - currentSize,
            currentSize * 2,
            currentSize * 2
        );
    }
}

function init() {
    resize();
    particles = [];
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, w, h);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    animationId = requestAnimationFrame(animate);
}

// Toggle function - turn animation on/off
function toggleAnimation() {
    if (isAnimating) {
        stopAnimation();
    } else {
        startAnimation();
    }
    return isAnimating;
}

// Start the animation
function startAnimation() {
    if (!isAnimating) {
        isAnimating = true;
        animate();
    }
}

// Stop the animation
function stopAnimation() {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

window.addEventListener('resize', init);
init();
startAnimation();