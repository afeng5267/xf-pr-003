// ============================================
// 飞行器大战 - Aircraft Battle
// 基于 HTML5 Canvas 的飞行射击游戏
// ============================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;   // 480
const H = canvas.height;  // 720

// ---- 游戏状态 ----
let gameState = 'menu'; // menu | playing | over
let score = 0;
let lives = 3;
let level = 1;
let frameCount = 0;

// ---- 玩家 ----
const player = {
    x: W / 2,
    y: H - 80,
    w: 40,
    h: 44,
    speed: 5,
    cooldown: 0,
    invincible: 0,
};

// ---- 实体数组 ----
let bullets = [];
let enemies = [];
let enemyBullets = [];
let particles = [];
let stars = [];
let powerups = [];

// ---- 输入处理 ----
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// ---- 初始化星空 ----
function initStars() {
    stars = [];
    for (let i = 0; i < 80; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 2 + 0.5,
            speed: Math.random() * 2 + 0.5,
        });
    }
}

// ---- 重置游戏 ----
function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    frameCount = 0;
    player.x = W / 2;
    player.y = H - 80;
    player.cooldown = 0;
    player.invincible = 0;
    bullets = [];
    enemies = [];
    enemyBullets = [];
    particles = [];
    powerups = [];
    initStars();
}

// ---- 粒子爆炸 ----
function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = Math.random() * 4 + 2;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 30,
            maxLife: 30,
            color,
            size: Math.random() * 4 + 2,
        });
    }
}

// ---- 生成敌机 ----
function spawnEnemy() {
    const types = ['small', 'small', 'small', 'medium', 'large'];
    const type = types[Math.floor(Math.random() * types.length)];
    let enemy;
    if (type === 'small') {
        enemy = { x: Math.random() * (W - 30) + 15, y: -30, w: 28, h: 30, hp: 1, maxHp: 1, speed: 2 + level * 0.3, type, shootChance: 0.002 };
    } else if (type === 'medium') {
        enemy = { x: Math.random() * (W - 40) + 20, y: -40, w: 38, h: 40, hp: 3, maxHp: 3, speed: 1.5 + level * 0.2, type, shootChance: 0.005 };
    } else {
        enemy = { x: Math.random() * (W - 60) + 30, y: -50, w: 56, h: 56, hp: 6, maxHp: 6, speed: 1 + level * 0.15, type, shootChance: 0.008 };
    }
    enemies.push(enemy);
}

// ---- 碰撞检测 ----
function hit(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
           Math.abs(a.y - b.y) < (a.h + b.h) / 2;
}

// ---- 绘制玩家飞机 ----
function drawPlayer() {
    if (player.invincible > 0 && frameCount % 6 < 3) return; // 闪烁
    ctx.save();
    ctx.translate(player.x, player.y);
    // 机身
    ctx.fillStyle = '#00ddff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-8, -5);
    ctx.lineTo(-20, 10);
    ctx.lineTo(-12, 12);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-6, 18);
    ctx.lineTo(6, 18);
    ctx.lineTo(6, 8);
    ctx.lineTo(12, 12);
    ctx.lineTo(20, 10);
    ctx.lineTo(8, -5);
    ctx.closePath();
    ctx.fill();
    // 驾驶舱
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -8, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // 引擎火焰
    ctx.fillStyle = frameCount % 4 < 2 ? '#ffaa00' : '#ff6600';
    ctx.beginPath();
    ctx.moveTo(-4, 18);
    ctx.lineTo(0, 26 + Math.random() * 6);
    ctx.lineTo(4, 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// ---- 绘制敌机 ----
function drawEnemy(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.type === 'small') {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(-14, -5);
        ctx.lineTo(-6, -8);
        ctx.lineTo(0, -15);
        ctx.lineTo(6, -8);
        ctx.lineTo(14, -5);
        ctx.closePath();
        ctx.fill();
    } else if (e.type === 'medium') {
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(-19, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(0, -20);
        ctx.lineTo(10, -10);
        ctx.lineTo(19, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillStyle = '#cc00cc';
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.lineTo(-28, 10);
        ctx.lineTo(-18, -10);
        ctx.lineTo(-8, -18);
        ctx.lineTo(8, -18);
        ctx.lineTo(18, -10);
        ctx.lineTo(28, 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff44ff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    // 血条
    if (e.hp < e.maxHp) {
        const barW = e.w;
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - barW / 2, e.y - e.h / 2 - 8, barW, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(e.x - barW / 2, e.y - e.h / 2 - 8, barW * (e.hp / e.maxHp), 4);
    }
}

// ---- 更新逻辑 ----
function update() {
    frameCount++;

    // 星空滚动
    for (const s of stars) {
        s.y += s.speed;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    }

    if (gameState !== 'playing') return;

    // 玩家移动
    if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if (keys['arrowright'] || keys['d']) player.x += player.speed;
    if (keys['arrowup'] || keys['w']) player.y -= player.speed;
    if (keys['arrowdown'] || keys['s']) player.y += player.speed;
    player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x));
    player.y = Math.max(player.h / 2, Math.min(H - player.h / 2, player.y));

    // 射击
    if (player.cooldown > 0) player.cooldown--;
    if (keys[' '] && player.cooldown <= 0) {
        bullets.push({ x: player.x - 8, y: player.y - 20, w: 4, h: 12, speed: 10 });
        bullets.push({ x: player.x + 8, y: player.y - 20, w: 4, h: 12, speed: 10 });
        player.cooldown = 8;
    }

    if (player.invincible > 0) player.invincible--;

    // 更新子弹
    bullets = bullets.filter(b => { b.y -= b.speed; return b.y > -20; });

    // 生成敌机
    const spawnRate = Math.max(20, 60 - level * 5);
    if (frameCount % spawnRate === 0) spawnEnemy();

    // 更新敌机
    for (const e of enemies) {
        e.y += e.speed;
        // 敌机射击
        if (Math.random() < e.shootChance && e.y > 0 && e.y < H * 0.7) {
            enemyBullets.push({ x: e.x, y: e.y + e.h / 2, w: 6, h: 12, speed: 4 });
        }
    }

    // 玩家子弹打敌机
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (hit(bullets[i], enemies[j])) {
                enemies[j].hp--;
                bullets.splice(i, 1);
                if (enemies[j].hp <= 0) {
                    const e = enemies[j];
                    const pts = e.type === 'small' ? 10 : e.type === 'medium' ? 30 : 100;
                    score += pts;
                    createExplosion(e.x, e.y, e.type === 'large' ? '#ff44ff' : '#ffaa00', e.type === 'large' ? 20 : 12);
                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // 敌机飞出屏幕
    enemies = enemies.filter(e => e.y < H + 50);

    // 敌机子弹
    enemyBullets = enemyBullets.filter(b => { b.y += b.speed; return b.y < H + 20; });

    // 敌机子弹打玩家
    if (player.invincible <= 0) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            if (hit(enemyBullets[i], player)) {
                enemyBullets.splice(i, 1);
                playerHit();
                break;
            }
        }
        // 敌机撞玩家
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (hit(enemies[i], player)) {
                createExplosion(enemies[i].x, enemies[i].y, '#ff4444', 16);
                enemies.splice(i, 1);
                playerHit();
                break;
            }
        }
    }

    // 粒子更新
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life--;
        return p.life > 0;
    });

    // 升级
    const newLevel = Math.floor(score / 500) + 1;
    if (newLevel > level) level = newLevel;

    // 更新HUD
    document.getElementById('score').textContent = '得分: ' + score;
    document.getElementById('lives').textContent = '生命: ' + '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    document.getElementById('level').textContent = '关卡: ' + level;
}

// ---- 玩家受伤 ----
function playerHit() {
    lives--;
    player.invincible = 90;
    createExplosion(player.x, player.y, '#00ddff', 15);
    if (lives <= 0) {
        gameState = 'over';
        document.getElementById('final-score').textContent = '最终得分: ' + score;
        document.getElementById('game-over-screen').style.display = 'flex';
    }
}

// ---- 渲染 ----
function render() {
    ctx.clearRect(0, 0, W, H);

    // 星空
    for (const s of stars) {
        ctx.fillStyle = 'rgba(255,255,255,' + (s.size / 2.5) + ')';
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    if (gameState === 'menu') return;

    // 玩家子弹
    ctx.fillStyle = '#00ffaa';
    for (const b of bullets) {
        ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffaa';
        ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        ctx.shadowBlur = 0;
    }

    // 敌机子弹
    ctx.fillStyle = '#ff3333';
    for (const b of enemyBullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 敌机
    for (const e of enemies) drawEnemy(e);

    // 玩家
    if (gameState === 'playing') drawPlayer();

    // 粒子
    for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// ---- 主循环 ----
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ---- 按钮事件 ----
document.getElementById('start-btn').addEventListener('click', () => {
    resetGame();
    gameState = 'playing';
    document.getElementById('start-screen').style.display = 'none';
});

document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
    gameState = 'playing';
    document.getElementById('game-over-screen').style.display = 'none';
});

// ---- 启动 ----
initStars();
gameLoop();
