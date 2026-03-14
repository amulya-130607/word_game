document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const coinsEl = document.getElementById('coins');
  const speedEl = document.getElementById('speed');
  const startBtn = document.getElementById('startBtn');
  const restartBtn = document.getElementById('restartBtn');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const finalScoreEl = document.getElementById('final-score');

  const diffSelect = document.getElementById('difficulty');
  const highScoreEl = document.getElementById('high-score');
  const hiScoreBox = document.getElementById('hi-score-box');
  let highScore = localStorage.getItem('neon_high_score') || 0;
  if (highScore > 0 && hiScoreBox) {
    hiScoreBox.style.display = 'flex';
    highScoreEl.innerText = highScore;
  }

  // Audio context for sound effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type, duration, vol = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCoinSound() {
    playTone(880, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(1200, 'sine', 0.2, 0.1), 50);
  }

  function playCrashSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  function playShieldPickupSound() {
    playTone(600, 'square', 0.1, 0.1);
    setTimeout(() => playTone(800, 'square', 0.15, 0.1), 100);
  }

  function playShieldBreakSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  function playSpeedUpSound() {
    playTone(400, 'sine', 0.1, 0.1);
    setTimeout(() => playTone(500, 'sine', 0.1, 0.1), 100);
    setTimeout(() => playTone(600, 'sine', 0.1, 0.1), 200);
    setTimeout(() => playTone(800, 'sine', 0.3, 0.1), 300);
  }

  function bumpElement(el) {
    if (!el) return;
    const box = el.closest ? el.closest('.hud-box') : el.parentElement;
    if (!box) return;
    box.classList.remove('bump');
    void box.offsetWidth;
    box.classList.add('bump');
    setTimeout(() => box.classList.remove('bump'), 150);
  }

  let animationId;
  let isGameOver = false;
  let isPlaying = false;

  // Game state
  let score = 0;
  let coinsCount = 0;
  let gameSpeed = 5;
  let roadOffset = 0;
  let roadOffsetTotal = 0;
  let frameCount = 0;
  let hasShield = false;

  // Difficulty modifiers
  let difficultySpeedIncrement = 0.5;
  let difficultySpawnRateMod = 1.0;

  // Curve state
  let currentCurveAmp = 0;
  let targetCurveAmp = 0;
  let cameraOffsetX = 0;

  function getRawCurveOffset(y) {
    return Math.sin((y - roadOffsetTotal) * 0.005) * currentCurveAmp;
  }

  function getCurveOffset(y) {
    return getRawCurveOffset(y) - cameraOffsetX;
  }

  class Car {
    constructor(logicalX, logicalY, width, height, color, isPlayer = false) {
      this.logicalX = logicalX;
      this.logicalY = logicalY;
      this.width = width;
      this.height = height;
      this.color = color;
      this.isPlayer = isPlayer;

      this.targetX = logicalX;
    }

    update() {
      if (this.isPlayer) {
        this.logicalX += (this.targetX - this.logicalX) * 0.2;
        if (this.logicalX < 20) {
          this.logicalX = 20;
          this.targetX = 20;
        }
        if (this.logicalX + this.width > canvas.width - 20) {
          this.logicalX = canvas.width - 20 - this.width;
          this.targetX = canvas.width - 20 - this.width;
        }
      } else {
        this.logicalY += gameSpeed * 0.8;
      }
    }

    draw() {
      let visualX = this.logicalX + getCurveOffset(this.logicalY);
      let visualY = this.logicalY;

      ctx.save();
      ctx.translate(visualX, visualY);

      ctx.shadowColor = this.color;
      ctx.shadowBlur = 15;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, 5);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#111';
      ctx.fillRect(4, this.height * 0.25, this.width - 8, this.height * 0.15);
      ctx.fillRect(4, this.height * 0.75, this.width - 8, this.height * 0.1);

      if (!this.isPlayer) {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.fillRect(2, this.height - 4, 8, 4);
        ctx.fillRect(this.width - 10, this.height - 4, 8, 4);
      } else {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 15;
        ctx.fillRect(2, 0, 8, 4);
        ctx.fillRect(this.width - 10, 0, 8, 4);
        
        if (hasShield) {
          ctx.strokeStyle = '#0088ff';
          ctx.shadowColor = '#0088ff';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(this.width/2, this.height/2, this.width/2 + 8, this.height/2 + 8, 0, 0, Math.PI*2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  class Coin {
    constructor(logicalX, logicalY) {
      this.logicalX = logicalX;
      this.logicalY = logicalY;
      this.width = 20;
      this.height = 20;
      this.rotation = 0;
    }
    update() {
      this.logicalY += gameSpeed;
      this.rotation += 0.05;
    }
    draw() {
      let visualX = this.logicalX + getCurveOffset(this.logicalY) + 10;
      let visualY = this.logicalY + 10;

      ctx.save();
      ctx.translate(visualX, visualY);
      ctx.scale(Math.sin(this.rotation), 1);

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffe600';
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  class ShieldPickup {
    constructor(logicalX, logicalY) {
      this.logicalX = logicalX;
      this.logicalY = logicalY;
      this.width = 20;
      this.height = 20;
      this.rotation = 0;
    }
    update() {
      this.logicalY += gameSpeed;
      this.rotation -= 0.05;
    }
    draw() {
      let visualX = this.logicalX + getCurveOffset(this.logicalY) + 10;
      let visualY = this.logicalY + 10;

      ctx.save();
      ctx.translate(visualX, visualY);
      ctx.scale(Math.sin(this.rotation), 1);

      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0088ff';
      ctx.fillStyle = '#00ccff';
      ctx.beginPath();
      // Triangle/diamond path
      ctx.moveTo(0, -10);
      ctx.lineTo(10, 0);
      ctx.lineTo(0, 10);
      ctx.lineTo(-10, 0);
      ctx.fill();

      ctx.restore();
    }
  }

  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.size = Math.random() * 4 + 2;
      this.life = 1;
      this.color = color;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.02;
    }
    draw() {
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  class ExhaustParticle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = Math.random() * 2 + gameSpeed * 0.5;
      this.size = Math.random() * 3 + 1;
      this.life = 0.6;
      this.color = color;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.04;
    }
    draw() {
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
  }

  let player;
  let enemies = [];
  let coins = [];
  let shields = [];
  let particles = [];
  let exhaustParticles = [];
  let lanes = [70, 160, 250, 340];

  function initGame() {
    initAudio();

    player = new Car(canvas.width / 2 - 20, canvas.height - 100, 40, 70, '#00f0ff', true);
    enemies = [];
    particles = [];
    exhaustParticles = [];
    coins = [];
    shields = [];

    score = 0;
    coinsCount = 0;
    frameCount = 0;
    roadOffset = 0;
    roadOffsetTotal = 0;
    hasShield = false;

    let baseSpeed = 6;
    difficultySpeedIncrement = 0.5;
    difficultySpawnRateMod = 1.0;

    if (diffSelect) {
      switch (diffSelect.value) {
        case 'easy':
          baseSpeed = 4;
          difficultySpeedIncrement = 0.2;
          difficultySpawnRateMod = 1.5;
          break;
        case 'normal':
          baseSpeed = 6;
          difficultySpeedIncrement = 0.5;
          difficultySpawnRateMod = 1.0;
          break;
        case 'hard':
          baseSpeed = 9;
          difficultySpeedIncrement = 0.8;
          difficultySpawnRateMod = 0.7;
          break;
        case 'extreme':
          baseSpeed = 13;
          difficultySpeedIncrement = 1.2;
          difficultySpawnRateMod = 0.5;
          break;
      }
    }
    gameSpeed = baseSpeed;

    currentCurveAmp = 0;
    targetCurveAmp = 0;
    cameraOffsetX = 0;

    scoreEl.innerText = score;
    coinsEl.innerText = coinsCount;
    speedEl.innerText = (gameSpeed / 5).toFixed(1) + ' x';

    isGameOver = false;
    isPlaying = true;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
  }

  function spawnEnemy() {
    const lane = Math.floor(Math.random() * lanes.length);
    const logicalX = lanes[lane] - 20;
    const logicalY = -100;

    const colors = ['#ff0055', '#ff9900', '#aa00ff', '#00ff66', '#ffff00'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const isOverlapping = enemies.some(e => Math.abs(e.logicalX - logicalX) < 40 && e.logicalY < 100) ||
      coins.some(c => Math.abs(c.logicalX - (logicalX + 10)) < 40 && c.logicalY < 100);

    if (!isOverlapping) {
      enemies.push(new Car(logicalX, logicalY, 40, 70, color));
    }
  }

  function spawnCoin() {
    const lane = Math.floor(Math.random() * lanes.length);
    const logicalX = lanes[lane] - 10;
    const logicalY = -50;

    const isOverlapping = enemies.some(e => Math.abs(e.logicalX - (logicalX - 10)) < 40 && e.logicalY < 100) ||
      coins.some(c => Math.abs(c.logicalX - logicalX) < 40 && c.logicalY < 100) ||
      shields.some(s => Math.abs(s.logicalX - logicalX) < 40 && s.logicalY < 100);

    if (!isOverlapping) {
      coins.push(new Coin(logicalX, logicalY));
    }
  }

  function spawnShield() {
    const lane = Math.floor(Math.random() * lanes.length);
    const logicalX = lanes[lane] - 10;
    const logicalY = -50;

    const isOverlapping = enemies.some(e => Math.abs(e.logicalX - (logicalX - 10)) < 40 && e.logicalY < 100) ||
      coins.some(c => Math.abs(c.logicalX - logicalX) < 40 && c.logicalY < 100) ||
      shields.some(s => Math.abs(s.logicalX - logicalX) < 40 && s.logicalY < 100);

    if (!isOverlapping && !hasShield && shields.length === 0) {
      shields.push(new ShieldPickup(logicalX, logicalY));
    }
  }

  function createExplosion(x, y) {
    playCrashSound();
    for (let i = 0; i < 40; i++) {
      particles.push(new Particle(x, y, '#ff0055'));
      particles.push(new Particle(x, y, '#ff9900'));
      particles.push(new Particle(x, y, '#ffffff'));
    }
  }

  function checkCollision(a, b) {
    const marginX = 8;
    const marginY = 8;
    return (
      a.logicalX + marginX < b.logicalX + b.width - marginX &&
      a.logicalX + a.width - marginX > b.logicalX + marginX &&
      a.logicalY + marginY < b.logicalY + b.height - marginY &&
      a.logicalY + a.height - marginY > b.logicalY + marginY
    );
  }

  function checkCoinCollision(p, c) {
    const pcX = p.logicalX + p.width / 2;
    const pcY = p.logicalY + p.height / 2;
    const ccX = c.logicalX + 10;
    const ccY = c.logicalY + 10;

    const dx = pcX - ccX;
    const dy = pcY - ccY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < (p.width / 2 + 10);
  }

  function drawMountains() {
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0a1a3a';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let y = canvas.height; y >= 0; y -= 20) {
      let mountX = Math.sin((y - roadOffsetTotal * 0.2) * 0.01) * 80 + 100;
      ctx.lineTo(mountX, y);
    }
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height);
    for (let y = canvas.height; y >= 0; y -= 20) {
      let mountX = canvas.width - (Math.sin((y - roadOffsetTotal * 0.25) * 0.015 + 2) * 80 + 100);
      ctx.lineTo(mountX, y);
    }
    ctx.lineTo(canvas.width, 0);
    ctx.fill();
  }

  function drawRoad() {
    drawMountains();

    ctx.fillStyle = '#0c121e';
    ctx.beginPath();
    for (let y = canvas.height; y >= 0; y -= 10) {
      ctx.lineTo(20 + getCurveOffset(y), y);
    }
    for (let y = 0; y <= canvas.height; y += 10) {
      ctx.lineTo(canvas.width - 20 + getCurveOffset(y), y);
    }
    ctx.fill();

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;

    ctx.beginPath();
    for (let y = 0; y <= canvas.height; y += 20) {
      if (y === 0) ctx.moveTo(20 + getCurveOffset(y), y);
      else ctx.lineTo(20 + getCurveOffset(y), y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let y = 0; y <= canvas.height; y += 20) {
      if (y === 0) ctx.moveTo(canvas.width - 20 + getCurveOffset(y), y);
      else ctx.lineTo(canvas.width - 20 + getCurveOffset(y), y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
    const dashHeight = 40;
    const gapHeight = 40;

    for (let i = 1; i < lanes.length; i++) {
      const lineLogicalX = (lanes[i - 1] + lanes[i]) / 2 + 20;
      for (let y = -dashHeight + roadOffset; y < canvas.height; y += dashHeight + gapHeight) {
        ctx.fillRect(lineLogicalX - 2 + getCurveOffset(y + dashHeight / 2), y, 4, dashHeight);
      }
    }
  }

  function gameLoop() {
    if (!isPlaying && !isGameOver) return;

    if (player) {
      cameraOffsetX = getRawCurveOffset(player.logicalY);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    roadOffset += gameSpeed;
    roadOffsetTotal += gameSpeed;
    if (roadOffset > 80) roadOffset -= 80;

    if (frameCount % 240 === 0) {
      targetCurveAmp = (Math.random() - 0.5) * 160;
    }
    currentCurveAmp += (targetCurveAmp - currentCurveAmp) * 0.005;

    drawRoad();

    if (!isGameOver) {
      frameCount++;

      if (frameCount % 30 === 0) {
        score += 5;
        scoreEl.innerText = score;
        bumpElement(scoreEl);

        if (gameSpeed < 20 && frameCount % 120 === 0) {
          gameSpeed += difficultySpeedIncrement;
          speedEl.innerText = (gameSpeed / 5).toFixed(1) + ' x';
          bumpElement(speedEl);
          playSpeedUpSound();
        }
      }

      let spawnRate = Math.max(10, Math.floor((70 - gameSpeed * 1.5) * difficultySpawnRateMod));
      if (frameCount % spawnRate === 0 && Math.random() > 0.1) {
        if (Math.random() > 0.3) {
           spawnEnemy();
        } else if (Math.random() > 0.1) {
           spawnCoin();
        } else {
           spawnShield();
        }
      }

      if (frameCount % 2 === 0) {
        exhaustParticles.push(new ExhaustParticle(
            player.logicalX + getCurveOffset(player.logicalY) + player.width / 2 + (Math.random() - 0.5) * 15,
            player.logicalY + player.height - 5,
            '#00f0ff'
        ));
      }
    }

    for (let i = exhaustParticles.length - 1; i >= 0; i--) {
      let p = exhaustParticles[i];
      if (!isGameOver) p.update();
      p.draw();
      if (p.life <= 0) exhaustParticles.splice(i, 1);
    }

    for (let i = coins.length - 1; i >= 0; i--) {
      let c = coins[i];
      if (!isGameOver) c.update();
      c.draw();

      if (!isGameOver && checkCoinCollision(player, c)) {
        coins.splice(i, 1);
        coinsCount++;
        score += 20;
        scoreEl.innerText = score;
        coinsEl.innerText = coinsCount;
        bumpElement(scoreEl);
        bumpElement(coinsEl);
        playCoinSound();
        continue;
      }

      if (c.logicalY > canvas.height) {
        coins.splice(i, 1);
      }
    }

    for (let i = shields.length - 1; i >= 0; i--) {
      let s = shields[i];
      if (!isGameOver) s.update();
      s.draw();

      if (!isGameOver && checkCoinCollision(player, s)) {
        shields.splice(i, 1);
        hasShield = true;
        playShieldPickupSound();
        continue;
      }

      if (s.logicalY > canvas.height) {
        shields.splice(i, 1);
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      let e = enemies[i];
      if (!isGameOver) e.update();
      e.draw();

      if (!isGameOver && checkCollision(player, e)) {
        if (hasShield) {
          hasShield = false;
          playShieldBreakSound();
          createExplosion(e.logicalX + getCurveOffset(e.logicalY) + e.width / 2, e.logicalY + e.height / 2);
          enemies.splice(i, 1);
          const gc = document.querySelector('.game-container');
          if (gc) {
            gc.classList.remove('shake');
            void gc.offsetWidth;
            gc.classList.add('shake');
          }
        } else {
          isGameOver = true;
          const gc = document.querySelector('.game-container');
          if (gc) {
            gc.classList.remove('shake');
            void gc.offsetWidth;
            gc.classList.add('shake');
          }
          createExplosion(player.logicalX + getCurveOffset(player.logicalY) + player.width / 2, player.logicalY + player.height / 2);
        }
      }

      if (e.logicalY > canvas.height) {
        enemies.splice(i, 1);
        if (!isGameOver) {
          score += 10;
          scoreEl.innerText = score;
          bumpElement(scoreEl);
        }
      }
    }

    if (!isGameOver) {
      player.update();
      player.draw();
    } else {
      let allDead = true;
      particles.forEach(p => {
        p.update();
        p.draw();
        if (p.life > 0) allDead = false;
      });

      if (allDead) {
        isPlaying = false;
        finalScoreEl.innerText = score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('neon_high_score', highScore);
          if (highScoreEl && hiScoreBox) {
            highScoreEl.innerText = highScore;
            hiScoreBox.style.display = 'flex';
          }
        }
        gameOverScreen.classList.remove('hidden');
        return;
      }
    }

    animationId = requestAnimationFrame(gameLoop);
  }

  // Controls
  window.addEventListener('keydown', (e) => {
    if (!isPlaying || isGameOver) return;
    const moveAmount = 90; // About one lane width
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      player.targetX -= moveAmount;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      player.targetX += moveAmount;
    }
  });

  let isDragging = false;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    movePlayerToInteraction(e);
  });

  window.addEventListener('mouseup', () => isDragging = false);

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      movePlayerToInteraction(e);
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    movePlayerToInteraction(e.touches[0]);
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    movePlayerToInteraction(e.touches[0]);
  }, { passive: true });

  function movePlayerToInteraction(event) {
    if (!isPlaying || isGameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (event.clientX - rect.left) * scaleX;

    player.targetX = x - player.width / 2;
  }

  startBtn.addEventListener('click', initGame);
  restartBtn.addEventListener('click', initGame);

  // Initial draw before start
  // Need player object logic ready for the initial render offset calculation
  player = new Car(canvas.width / 2 - 20, canvas.height - 100, 40, 70, '#00f0ff', true);
  cameraOffsetX = getRawCurveOffset(player.logicalY);
  drawRoad();
  player.draw();
});
