class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.angle = 0;
        
        // Физика движения с инерцией
        this.velocity = { x: 0, y: 0 };
        this.acceleration = 0.4;
        this.friction = 0.85;
        this.maxSpeed = 4;
        
        // Система прогрессии
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        this.skillPoints = 0;
        
        // Характеристики с возможностью улучшения
        this.stats = {
            maxHealth: 100,
            damage: 1.0,
            speed: 1.0,
            reload: 1.0,
            critChance: 0.05,
            critMultiplier: 2.0
        };
        
        this.health = this.stats.maxHealth;
        this.maxAmmo = 30;
        this.ammo = this.maxAmmo;
        
        // Система оружия
        this.weapons = ['pistol'];
        this.currentWeaponIndex = 0;
        this.weaponData = {
            pistol: { damage: 25, fireRate: 15, spread: 0.1, ammoType: 'standard' },
            shotgun: { damage: 15, fireRate: 45, spread: 0.4, ammoType: 'shells', pellets: 5 },
            rifle: { damage: 40, fireRate: 25, spread: 0.05, ammoType: 'standard' },
            smg: { damage: 18, fireRate: 8, spread: 0.2, ammoType: 'standard' }
        };
        
        // Управление и анимация
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.shootCooldown = 0;
        this.animationFrame = 0;
        this.isMoving = false;
        
        this.setupControls();
    }
    
    setupControls() {
        // Обработчики клавиатуры
        document.addEventListener('keydown', (e) => {
            this.keys[e.code.toLowerCase()] = true;
            
            // Пауза на ESC
            if (e.code === 'Escape') {
                if (window.game && typeof window.game.togglePause === 'function') {
                    window.game.togglePause();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code.toLowerCase()] = false;
        });
        
        // Обработчики мыши
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            });
            
            canvas.addEventListener('mousedown', (e) => {
                if (e.button === 0) {
                    this.isMouseDown = true;
                }
            });
            
            canvas.addEventListener('mouseup', (e) => {
                if (e.button === 0) {
                    this.isMouseDown = false;
                }
            });
            
            canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }
    }
    
    update(obstacles) {
        this.updateMovement();
        this.updateShooting();
        this.updateAnimation();
        this.checkLevelUp();
        
        // Обновление угла поворота
        this.angle = Math.atan2(this.mouseY - this.y, this.mouseX - this.x);
        
        // Применение физики движения
        this.applyPhysics(obstacles);
    }
    
    updateMovement() {
        let inputX = 0;
        let inputY = 0;
        
        if (this.keys['keyw'] || this.keys['arrowup']) inputY -= 1;
        if (this.keys['keys'] || this.keys['arrowdown']) inputY += 1;
        if (this.keys['keya'] || this.keys['arrowleft']) inputX -= 1;
        if (this.keys['keyd'] || this.keys['arrowright']) inputX += 1;
        
        // Нормализация диагонального движения
        if (inputX !== 0 && inputY !== 0) {
            inputX *= 0.707;
            inputY *= 0.707;
        }
        
        // Применение ускорения с учетом статов
        const speedMultiplier = this.stats.speed;
        this.velocity.x += inputX * this.acceleration * speedMultiplier;
        this.velocity.y += inputY * this.acceleration * speedMultiplier;
        
        this.isMoving = inputX !== 0 || inputY !== 0;
    }
    
    applyPhysics(obstacles) {
        // Применение трения
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        // Ограничение максимальной скорости
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
        
        // Проверка столкновений и движение
        this.moveWithCollision(obstacles);
    }
    
    moveWithCollision(obstacles) {
        // Движение по X
        const newX = this.x + this.velocity.x;
        if (this.canMoveTo(newX, this.y, obstacles)) {
            this.x = newX;
        } else {
            this.velocity.x = 0;
        }
        
        // Движение по Y
        const newY = this.y + this.velocity.y;
        if (this.canMoveTo(this.x, newY, obstacles)) {
            this.y = newY;
        } else {
            this.velocity.y = 0;
        }
    }
    
    canMoveTo(x, y, obstacles) {
        // Проверка границ
        if (x - this.width / 2 < 0 || x + this.width / 2 > 800 ||
            y - this.height / 2 < 0 || y + this.height / 2 > 600) {
            return false;
        }
        
        // Проверка препятствий
        if (obstacles) {
            const playerRect = {
                x: x - this.width / 2,
                y: y - this.height / 2,
                width: this.width,
                height: this.height
            };
            
            for (let obstacle of obstacles) {
                if (Utils.checkCollision(playerRect, obstacle)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    updateShooting() {
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        
        if (this.isMouseDown && this.shootCooldown === 0 && this.ammo > 0) {
            this.shoot();
        }
    }
    
    shoot() {
        const weapon = this.getCurrentWeapon();
        const fireRate = weapon.fireRate / this.stats.reload;
        
        this.ammo--;
        this.shootCooldown = fireRate;
        
        // Определяем критический удар
        const isCritical = Math.random() < this.stats.critChance;
        const damage = weapon.damage * this.stats.damage * (isCritical ? this.stats.critMultiplier : 1);
        
        // Создание пуль (учитываем дробовик)
        const pelletsCount = weapon.pellets || 1;
        for (let i = 0; i < pelletsCount; i++) {
            this.createBullet(weapon, damage, isCritical);
        }
        
        // Эффекты
        this.createMuzzleFlash();
        this.updateUI();
    }
    
    createBullet(weapon, damage, isCritical) {
        const spread = weapon.spread;
        const angle = this.angle + (Math.random() - 0.5) * spread;
        
        const bulletSpeed = 10;
        const bulletX = this.x + Math.cos(this.angle) * 25;
        const bulletY = this.y + Math.sin(this.angle) * 25;
        const bulletVx = Math.cos(angle) * bulletSpeed;
        const bulletVy = Math.sin(angle) * bulletSpeed;
        
        if (window.game && window.game.bullets) {
            const bullet = new Bullet(bulletX, bulletY, bulletVx, bulletVy);
            bullet.damage = damage;
            bullet.isCritical = isCritical;
            window.game.bullets.push(bullet);
        }
    }
    
    getCurrentWeapon() {
        const weaponName = this.weapons[this.currentWeaponIndex];
        return this.weaponData[weaponName];
    }
    
    switchWeapon(direction = 1) {
        this.currentWeaponIndex = (this.currentWeaponIndex + direction) % this.weapons.length;
        if (this.currentWeaponIndex < 0) {
            this.currentWeaponIndex = this.weapons.length - 1;
        }
    }
    
    addExperience(amount) {
        this.experience += amount;
        this.checkLevelUp();
    }
    
    checkLevelUp() {
        while (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        this.skillPoints += 2;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.5);
        
        // Автоматические бонусы за уровень
        this.stats.maxHealth += 10;
        this.health = Math.min(this.health + 10, this.stats.maxHealth);
        
        // Уведомление о повышении уровня
        if (window.game && window.game.showLevelUpNotification) {
            window.game.showLevelUpNotification(this.level);
        }
    }
    
    upgradeStats(stat, cost) {
        if (this.skillPoints >= cost) {
            this.skillPoints -= cost;
            
            switch(stat) {
                case 'damage':
                    this.stats.damage += 0.15;
                    break;
                case 'speed':
                    this.stats.speed += 0.1;
                    break;
                case 'reload':
                    this.stats.reload += 0.1;
                    break;
                case 'health':
                    this.stats.maxHealth += 20;
                    this.health += 20;
                    break;
                case 'crit':
                    this.stats.critChance += 0.02;
                    break;
            }
            return true;
        }
        return false;
    }
    
    updateAnimation() {
        if (this.isMoving) {
            this.animationFrame += 0.2;
        } else {
            this.animationFrame *= 0.9;
        }
    }
    
    createMuzzleFlash() {
        if (window.game && window.game.particles) {
            const flashX = this.x + Math.cos(this.angle) * 25;
            const flashY = this.y + Math.sin(this.angle) * 25;
            window.game.particles.createMuzzleFlash(flashX, flashY);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            if (window.game && typeof window.game.gameOver === 'function') {
                window.game.gameOver();
            }
        }
        this.updateUI();
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.stats.maxHealth);
        this.updateUI();
    }
    
    addAmmo(amount) {
        this.ammo = Math.min(this.ammo + amount, this.maxAmmo);
        this.updateUI();
    }
    
    updateUI() {
        const healthElement = document.getElementById('health');
        const ammoElement = document.getElementById('ammo');
        
        if (healthElement) healthElement.textContent = this.health;
        if (ammoElement) ammoElement.textContent = this.ammo;
    }
    
    render(ctx) {
        ctx.save();
        
        // Отрисовка игрока с анимацией
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Тело игрока с эффектом движения
        const wobble = this.isMoving ? Math.sin(this.animationFrame) * 1 : 0;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(-this.width / 2, -this.height / 2 + wobble, this.width, this.height);
        
        // Оружие
        const weapon = this.getCurrentWeapon();
        ctx.fillStyle = '#333';
        ctx.fillRect(this.width / 4, -2, this.width / 2, 4);
        
        // Индикатор уровня
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.level.toString(), 0, -this.height / 2 - 5);
        
        ctx.restore();
        
        // Полоска здоровья
        this.renderHealthBar(ctx);
        
        // Индикатор опыта
        this.renderExperienceBar(ctx);
    }
    
    renderHealthBar(ctx) {
        if (this.health < this.stats.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.stats.maxHealth;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - barWidth / 2, this.y - 25, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - barWidth / 2, this.y - 25, barWidth * healthPercent, barHeight);
        }
    }
    
    renderExperienceBar(ctx) {
        const barWidth = 25;
        const barHeight = 2;
        const expPercent = this.experience / this.experienceToNext;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - 30, barWidth, barHeight);
        
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x - barWidth / 2, this.y - 30, barWidth * expPercent, barHeight);
    }
}
