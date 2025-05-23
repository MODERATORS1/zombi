class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas не найден!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Игровые объекты
        this.player = new Player(400, 300);
        this.zombies = [];
        this.bullets = [];
        this.items = [];
        this.particles = new ParticleSystem();
        this.gameMap = new GameMap();
        
        // Новые массивы
        this.enemyProjectiles = [];
        this.notifications = [];
        
        // Состояние игры
        this.isRunning = false;
        this.isPaused = false;
        this.gameOverState = false;
        
        // Система волн
        this.currentWave = 1;
        this.zombiesInWave = 5;
        this.zombiesSpawned = 0;
        this.waveActive = false;
        this.waveDelay = 180;
        this.waveTimer = 0;
        
        // Статистика
        this.kills = 0;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('zombieHighScore') || '0');
        
        // Спавн предметов
        this.itemSpawnTimer = 600;
        this.itemSpawnDelay = 600;
        
        // Настройки игры
        this.settings = {
            difficulty: 'normal',
            showFPS: false,
            autoPickup: false,
            dynamicLighting: false
        };
        
        // FPS счетчик
        this.fps = 60;
        this.lastTime = 0;
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        this.hideAllMenus();
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.style.display = 'block';
        }
        this.gameLoop();
    }
    
    hideAllMenus() {
        const menus = ['startMenu', 'gameOver', 'settingsMenu', 'upgradeShop'];
        menus.forEach(menuId => {
            const menu = document.getElementById(menuId);
            if (menu) {
                menu.style.display = 'none';
            }
        });
    }
    
    gameLoop() {
        if (this.isRunning && !this.isPaused && !this.gameOverState) {
            this.update();
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Обновление игрока
        this.player.update(this.gameMap.obstacles);
        
        // Обновление пуль
        this.bullets = this.bullets.filter(bullet => {
            if (!bullet) return false;
            
            const shouldRemove = bullet.update(this.gameMap.obstacles);
            
            if (!shouldRemove) {
                // Проверка попаданий по зомби
                for (let i = this.zombies.length - 1; i >= 0; i--) {
                    const zombie = this.zombies[i];
                    if (!zombie) continue;
                    
                    const distance = Utils.distance(bullet.x, bullet.y, zombie.x, zombie.y);
                    
                    if (distance < bullet.radius + zombie.width / 2) {
                        const zombieDied = zombie.takeDamage(bullet.damage);
                        if (zombieDied) {
                            this.zombies.splice(i, 1);
                            this.addKill();
                            this.addScore(100);
                            this.player.addExperience(25);
                        }
                        return false;
                    }
                }
                
                // Проверка попаданий по разрушаемым объектам
                if (this.gameMap.destructibles) {
                    for (let i = this.gameMap.destructibles.length - 1; i >= 0; i--) {
                        const destructible = this.gameMap.destructibles[i];
                        const distance = Utils.distance(bullet.x, bullet.y, 
                            destructible.x + destructible.width/2, 
                            destructible.y + destructible.height/2);
                        
                        if (distance < bullet.radius + destructible.width / 2) {
                            const destroyed = this.gameMap.damageDestructible(destructible, bullet.damage);
                            if (destroyed) {
                                this.gameMap.destructibles.splice(i, 1);
                            }
                            return false;
                        }
                    }
                }
            }
            
            return !shouldRemove;
        });
        
        // Обновление зомби
        this.zombies = this.zombies.filter(zombie => {
            const shouldRemove = zombie.update(this.player, this.gameMap.obstacles);
            return !shouldRemove;
        });
        
        // Обновление предметов
        this.items = this.items.filter(item => {
            item.update();
            return !item.checkPickup(this.player);
        });
        
        // Обновление частиц
        this.particles.update();
        
        // Система волн
        this.updateWaveSystem();
        
        // Спавн предметов
        this.updateItemSpawning();
        
        // Обновление уведомлений
        this.updateNotifications();
        
        // Обновление UI
        this.updateUI();
    }
    
    updateNotifications() {
        this.notifications = this.notifications.filter(notification => {
            notification.life++;
            notification.y -= 1;
            return notification.life < notification.maxLife;
        });
    }
    
    showLevelUpNotification(level) {
        this.notifications.push({
            text: `Уровень ${level}!`,
            x: this.player.x,
            y: this.player.y - 40,
            life: 0,
            maxLife: 120,
            color: '#FFD700',
            fontSize: 16
        });
    }
    
    updateWaveSystem() {
        if (this.waveActive) {
            if (this.zombiesSpawned < this.zombiesInWave) {
                if (Math.random() < 0.03) {
                    this.spawnZombie();
                    this.zombiesSpawned++;
                }
            }
            
            if (this.zombiesSpawned >= this.zombiesInWave && this.zombies.length === 0) {
                this.waveActive = false;
                this.waveTimer = this.waveDelay;
                this.currentWave++;
                this.updateWaveUI();
            }
        } else {
            this.waveTimer--;
            if (this.waveTimer <= 0) {
                this.startNewWave();
            }
        }
    }
    
    startNewWave() {
        this.waveActive = true;
        this.zombiesInWave = Math.floor(5 + (this.currentWave - 1) * 2.5);
        this.zombiesSpawned = 0;
        this.updateWaveUI();
        
        // Сразу спавним 2-3 зомби для начала волны
        for (let i = 0; i < Math.min(3, this.zombiesInWave); i++) {
            this.spawnZombie();
            this.zombiesSpawned++;
        }
        
        // Бонус патронов каждые 3 волны
        if (this.currentWave % 3 === 0) {
            this.player.addAmmo(15);
        }
    }
    
    spawnZombie() {
        const spawnPoint = this.gameMap.getRandomSpawnPoint();
        const zombie = new Zombie(spawnPoint.x, spawnPoint.y);
        
        // Увеличение сложности
        const difficultyMultiplier = {
            'easy': 0.7,
            'normal': 1.0,
            'hard': 1.4
        }[this.settings.difficulty] || 1.0;
        
        zombie.speed *= (1 + (this.currentWave - 1) * 0.1) * difficultyMultiplier;
        zombie.maxHealth += Math.floor((this.currentWave - 1) * 5 * difficultyMultiplier);
        zombie.health = zombie.maxHealth;
        zombie.damage = Math.floor(zombie.damage * difficultyMultiplier);
        
        this.zombies.push(zombie);
    }
    
    updateItemSpawning() {
        if (this.itemSpawnTimer === undefined) {
            this.itemSpawnTimer = this.itemSpawnDelay;
        }
        
        this.itemSpawnTimer--;
        if (this.itemSpawnTimer <= 0) {
            this.spawnRandomItem();
            this.itemSpawnTimer = this.itemSpawnDelay + Utils.randomInt(-120, 120);
        }
    }
    
    spawnRandomItem() {
        const spawnPoint = this.gameMap.getRandomSpawnPoint();
        const itemType = Math.random() < 0.6 ? 'ammo' : 'health';
        
        if (this.items.length < 5) {
            this.items.push(new Item(spawnPoint.x, spawnPoint.y, itemType));
        }
    }
    
    addKill() {
        this.kills++;
    }
    
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('zombieHighScore', this.highScore.toString());
        }
    }
    
    updateBulletCount() {
        const bulletCountElement = document.getElementById('bulletCount');
        if (bulletCountElement) {
            bulletCountElement.textContent = this.bullets.length;
        }
    }
    
    updateUI() {
        const elements = {
            'kills': this.kills,
            'health': this.player.health,
            'ammo': this.player.ammo,
            'wave': this.currentWave,
            'score': this.score,
            'highScore': this.highScore,
            'playerLevel': this.player.level,
            'playerExp': this.player.experience,
            'playerExpNext': this.player.experienceToNext,
            'skillPoints': this.player.skillPoints
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        this.updateBulletCount();
    }
    
    updateWaveUI() {
        this.updateUI();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    gameOver() {
        this.gameOverState = true;
        this.isRunning = false;
        
        const finalElements = {
            'finalKills': this.kills,
            'finalScore': this.score,
            'finalWave': this.currentWave,
            'finalLevel': this.player.level
        };
        
        Object.entries(finalElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        const gameOverDiv = document.getElementById('gameOver');
        if (gameOverDiv) gameOverDiv.style.display = 'block';
    }
    
    restart() {
        this.player = new Player(400, 300);
        this.zombies = [];
        this.bullets = [];
        this.items = [];
        this.particles = new ParticleSystem();
        this.notifications = [];
        
        this.gameOverState = false;
        this.isPaused = false;
        this.currentWave = 1;
        this.zombiesInWave = 5;
        this.zombiesSpawned = 0;
        this.waveActive = false;
        this.waveTimer = 0;
        this.kills = 0;
        this.score = 0;
        this.itemSpawnTimer = this.itemSpawnDelay;
        
        this.hideAllMenus();
        this.updateUI();
        this.startNewWave();
    }
    
    startGame() {
        this.isRunning = true;
        this.hideAllMenus();
        this.restart();
    }
    
    showStartMenu() {
        this.isRunning = false;
        this.hideAllMenus();
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.style.display = 'block';
        }
    }
    
    showInstructions() {
        alert(`🎮 УПРАВЛЕНИЕ:
        
WASD - Движение персонажа
Мышь - Поворот и стрельба
ESC - Пауза
Q/E - Смена оружия
E - Взаимодействие с объектами

🎯 ЦЕЛЬ:
Выживайте как можно дольше, убивая волны зомби!
Подбирайте аптечки и патроны.
Получайте опыт и повышайте уровень.
Взрывайте бочки для урона по зомби.

Удачи! 🧟‍♂️💀`);
    }
    
    render() {
        const currentTime = performance.now();
        this.calculateFPS(currentTime);
        
        // Очистка экрана
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка карты
        this.gameMap.render(this.ctx);
        
        // Отрисовка предметов
        this.items.forEach(item => {
            if (item && typeof item.render === 'function') {
                item.render(this.ctx);
            }
        });
        
        // Отрисовка игрока
        if (this.player && typeof this.player.render === 'function') {
            this.player.render(this.ctx);
        }
        
        // Отрисовка зомби
        this.zombies.forEach(zombie => {
            if (zombie && typeof zombie.render === 'function') {
                zombie.render(this.ctx);
            }
        });
        
        // Отрисовка пуль
        this.ctx.save();
        this.bullets.forEach(bullet => {
            if (bullet && typeof bullet.render === 'function') {
                bullet.render(this.ctx);
            }
        });
        this.ctx.restore();
        
        // Отрисовка частиц
        if (this.particles && typeof this.particles.render === 'function') {
            this.particles.render(this.ctx);
        }
        
        // Отрисовка уведомлений
        this.renderNotifications();
        
        // Отладочная информация
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Зомби: ${this.zombies.length}`, 10, 580);
        this.ctx.fillText(`Пули: ${this.bullets.length}`, 100, 580);
        this.ctx.fillText(`Волна: ${this.currentWave} (${this.waveActive ? 'активна' : 'пауза'})`, 180, 580);
        
        // Информация о волне
        if (!this.waveActive && this.waveTimer > 0) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Волна ${this.currentWave} начнется через ${Math.ceil(this.waveTimer / 60)}`,
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
        
        // Информация о паузе
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Нажмите ESC для продолжения', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
        
        // Отображение FPS
        if (this.settings.showFPS) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 30);
        }
    }
    
    renderNotifications() {
        this.notifications.forEach(notification => {
            const alpha = 1 - (notification.life / notification.maxLife);
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = notification.color;
            this.ctx.font = `${notification.fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(notification.text, notification.x, notification.y);
            this.ctx.restore();
        });
    }
    
    calculateFPS(currentTime) {
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
        this.frameCount++;
    }
    
    start() {
        this.isRunning = true;
    }
}

// Запуск игры
let game;
window.addEventListener('load', () => {
    try {
        game = new Game();
        window.game = game;
        console.log('Игра успешно инициализирована');
    } catch (error) {
        console.error('Ошибка инициализации игры:', error);
        alert('Ошибка загрузки игры. Проверьте консоль для деталей.');
    }
});
