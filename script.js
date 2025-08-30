const canvas = document.getElementById('table');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

const friction = 0.99;
const pocketRadius = 18;
const pockets = [
  { x: 0, y: 0 },
  { x: width / 2, y: 0 },
  { x: width, y: 0 },
  { x: 0, y: height },
  { x: width / 2, y: height },
  { x: width, y: height }
];

class Ball {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
    this.color = color;
    this.inPocket = false;
  }

  draw() {
    if (this.inPocket) return;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  update() {
    if (this.inPocket) return;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= friction;
    this.vy *= friction;
    if (Math.hypot(this.vx, this.vy) < 0.01) {
      this.vx = 0;
      this.vy = 0;
    }

    // Bounce off walls
    if (this.x <= this.radius || this.x >= width - this.radius) this.vx *= -1;
    if (this.y <= this.radius || this.y >= height - this.radius) this.vy *= -1;
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

    // Check pockets
    for (const p of pockets) {
      if (Math.hypot(this.x - p.x, this.y - p.y) < pocketRadius) {
        this.inPocket = true;
        this.vx = 0;
        this.vy = 0;
      }
    }
  }
}

const balls = [
  new Ball(150, 200, 'white'),
  new Ball(500, 200, 'red'),
  new Ball(530, 180, 'blue'),
  new Ball(530, 220, 'yellow')
];
const cueBall = balls[0];

let isAiming = false;
let aimPos = null;

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (Math.hypot(x - cueBall.x, y - cueBall.y) <= cueBall.radius) {
    isAiming = true;
    aimPos = { x, y };
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isAiming) {
    const rect = canvas.getBoundingClientRect();
    aimPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
});

canvas.addEventListener('mouseup', () => {
  if (isAiming) {
    const dx = cueBall.x - aimPos.x;
    const dy = cueBall.y - aimPos.y;
    cueBall.vx = dx * 0.1;
    cueBall.vy = dy * 0.1;
    isAiming = false;
  }
});

function handleCollisions() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const b1 = balls[i];
      const b2 = balls[j];
      if (b1.inPocket || b2.inPocket) continue;
      const dx = b2.x - b1.x;
      const dy = b2.y - b1.y;
      const dist = Math.hypot(dx, dy);
      const minDist = b1.radius + b2.radius;
      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const totalVx = b1.vx - b2.vx;
        const totalVy = b1.vy - b2.vy;
        const speed = totalVx * Math.cos(angle) + totalVy * Math.sin(angle);
        if (speed > 0) {
          const impulse = speed / 2;
          b1.vx -= impulse * Math.cos(angle);
          b1.vy -= impulse * Math.sin(angle);
          b2.vx += impulse * Math.cos(angle);
          b2.vy += impulse * Math.sin(angle);
        }
        const overlap = minDist - dist;
        b1.x -= Math.cos(angle) * overlap / 2;
        b1.y -= Math.sin(angle) * overlap / 2;
        b2.x += Math.cos(angle) * overlap / 2;
        b2.y += Math.sin(angle) * overlap / 2;
      }
    }
  }
}

function drawAim() {
  if (isAiming) {
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(aimPos.x, aimPos.y);
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }
}

function drawPockets() {
  ctx.fillStyle = 'black';
  for (const p of pockets) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, pocketRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function loop() {
  ctx.clearRect(0, 0, width, height);
  drawPockets();
  handleCollisions();
  for (const ball of balls) {
    ball.update();
    ball.draw();
  }
  drawAim();
  requestAnimationFrame(loop);
}

loop();
