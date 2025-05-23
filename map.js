class GameMap {
    constructor() {
        this.obstacles = [];
        this.interactables = [];
        this.destructibles = [];
        this.spawners = [];
        this.lighting = [];
        
        this.generateMap();
    }
    
    generateMap() {
        this.generateObstacles();
        this.generateInteractables();
        this.generateLighting();
    }
    
    generateObstacles() {
        // Препятствия на карте
        const obstacleData = [
            { x: 100, y: 100, width: 60, height: 40 },
            { x: 300, y: 80, width: 40, height: 80 },
            { x: 600, y: 150, width: 80, height: 30 },
            { x: 150, y: 300, width: 50, height: 50 },
            { x: 450, y: 250, width: 70, height: 40 },
            { x: 650, y: 350, width: 40, height: 60 },
            { x: 200, y: 450, width: 80, height: 40 },
            { x: 500, y: 480, width: 60, height: 50 },
            { x: 50, y: 500, width: 40, height: 40 },
            { x: 700, y: 500, width: 50, height: 30 }
        ];
        
        this.obstacles.push(...obstacleData);
    }
    
    generateInteractables() {
        // Взрывающиеся бочки
        this.addBarrel(200, 200);
        this.addBarrel(600, 400);
        this.addBarrel(100, 450);
        
        // Ящики с предметами
        this.addCrate(350, 150, 'ammo');
        this.addCrate(500, 350, 'health');
        this.addCrate(150, 500, 'weapon');
        
        // Двери
        this.addDoor(400, 80, 'horizontal');
        this.addDoor(50, 300, 'vertical');
    }
    
    addBarrel(x, y) {
        this.destructibles.push({
            type: 'barrel',
            x: x,
            y: y,
            width: 20,
            height: 20,
            health: 30,
            maxHealth: 30,
            explosionRadius: 60,
            explosionDamage: 40,
            color: '#8B4513'
        });
    }
    
    addCrate(x, y, lootType) {
        this.interactables.push({
            type: 'crate',
            x: x,
            y: y,
            width: 25,
            height: 25,
            lootType: lootType,
            opened: false,
            color: '#D2691E'
        });
    }
    
    addDoor(x, y, orientation) {
        this.interactables.push({
            type: 'door',
            x: x,
            y: y,
            width: orientation === 'horizontal' ? 60 : 10,
            height: orientation === 'horizontal' ? 10 : 60,
            orientation: orientation,
            isOpen: false,
            color: '#8B4513'
        });
    }
    
    generateLighting() {
        // Источники света
        this.lighting.push({
            x: 100, y: 100, radius: 80, intensity: 0.8, color: '#FFD700'
        });
        this.lighting.push({
            x: 700, y: 500, radius: 100, intensity: 0.6, color: '#FFA500'
        });
    }
    
    checkInteraction(player) {
        this.interactables.forEach((item, index) => {
            const distance = Utils.distance(player.x, player.y, item.x + item.width/2, item.y + item.height/2);
            
            if (distance < 30) {
                switch(item.type) {
                    case 'crate':
                        if (!item.opened) {
                            this.openCrate(item, player);
                        }
                        break;
                    case 'door':
                        this.toggleDoor(item);
                        break;
                }
            }
        });
    }
    
    openCrate(crate, player) {
        crate.opened = true;
        
        switch(crate.lootType) {
            case 'ammo':
                player.addAmmo(Utils.randomInt(10, 20));
                break;
            case 'health':
                player.heal(Utils.randomInt(20, 40));
                break;
            case 'weapon':
                this.giveRandomWeapon(player);
                break;
        }
        
        // Эффект открытия
        if (window.game && window.game.particles) {
            window.game.particles.createItemParticles(crate.x + crate.width/2, crate.y + crate.height/2);
        }
    }
    
    giveRandomWeapon(player) {
        const availableWeapons = ['shotgun', 'rifle', 'smg'];
        const newWeapon = availableWeapons[Utils.randomInt(0, availableWeapons.length - 1)];
        
        if (!player.weapons.includes(newWeapon)) {
            player.weapons.push(newWeapon);
        }
    }
    
    toggleDoor(door) {
        door.isOpen = !door.isOpen;
    }
    
    damageDestructible(destructible, damage) {
        destructible.health -= damage;
        
        if (destructible.health <= 0) {
            this.explodeBarrel(destructible);
            return true;
        }
        return false;
    }
    
    explodeBarrel(barrel) {
        // Урон игроку
        if (window.game && window.game.player) {
            const distance = Utils.distance(barrel.x, barrel.y, window.game.player.x, window.game.player.y);
            if (distance <= barrel.explosionRadius) {
                const damage = Math.floor(barrel.explosionDamage * (1 - distance / barrel.explosionRadius));
                window.game.player.takeDamage(damage);
            }
        }
        
        // Урон зомби
        if (window.game && window.game.zombies) {
            window.game.zombies.forEach(zombie => {
                const distance = Utils.distance(barrel.x, barrel.y, zombie.x, zombie.y);
                if (distance <= barrel.explosionRadius) {
                    const damage = Math.floor(barrel.explosionDamage * (1 - distance / barrel.explosionRadius));
                    zombie.takeDamage(damage);
                }
            });
        }
        
        // Цепная реакция других бочек
        this.destructibles.forEach(other => {
            if (other !== barrel && other.type === 'barrel') {
                const distance = Utils.distance(barrel.x, barrel.y, other.x, other.y);
                if (distance <= barrel.explosionRadius) {
                    setTimeout(() => this.damageDestructible(other, 50), 100);
                }
            }
        });
        
        // Визуальный эффект
        if (window.game && window.game.particles) {
            window.game.particles.createExplosion(barrel.x + barrel.width/2, barrel.y + barrel.height/2);
        }
    }
    
    getRandomSpawnPoint() {
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const x = Utils.randomInt(50, 750);
            const y = Utils.randomInt(50, 550);
            
            const testRect = { x: x - 20, y: y - 20, width: 40, height: 40 };
            let canSpawn = true;
            
            // Проверяем расстояние от игрока
            if (window.game && window.game.player) {
                const distanceFromPlayer = Utils.distance(x, y, window.game.player.x, window.game.player.y);
                if (distanceFromPlayer < 100) {
                    canSpawn = false;
                }
            }
            
            // Проверяем столкновения с препятствиями
            if (canSpawn) {
                for (let obstacle of this.obstacles) {
                    if (Utils.checkCollision(testRect, obstacle)) {
                        canSpawn = false;
                        break;
                    }
                }
            }
            
            if (canSpawn) {
                return { x, y };
            }
            
            attempts++;
        }
        
        // Fallback точки спавна
        const fallbackPoints = [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ];
        
        return fallbackPoints[Utils.randomInt(0, fallbackPoints.length - 1)];
    }
    
    render(ctx) {
        if (!ctx) return;
        
        // Отрисовка препятствий
        this.renderObstacles(ctx);
        
        // Отрисовка интерактивных объектов
        this.renderInteractables(ctx);
        
        // Отрисовка разрушаемых объектов
        this.renderDestructibles(ctx);
        
        // Эффекты освещения (если включены)
        if (window.game && window.game.settings.dynamicLighting) {
            this.renderLighting(ctx);
        }
    }
    
    renderObstacles(ctx) {
        ctx.fillStyle = '#444';
        this.obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Тень для объема
            ctx.fillStyle = '#222';
            ctx.fillRect(obstacle.x + 2, obstacle.y + 2, obstacle.width, obstacle.height);
            ctx.fillStyle = '#444';
        });
    }
    
    renderInteractables(ctx) {
        this.interactables.forEach(item => {
            switch(item.type) {
                case 'crate':
                    this.renderCrate(ctx, item);
                    break;
                case 'door':
                    this.renderDoor(ctx, item);
                    break;
            }
        });
    }
    
    renderCrate(ctx, crate) {
        if (crate.opened) {
            ctx.fillStyle = '#654321';
            ctx.fillRect(crate.x, crate.y, crate.width, crate.height * 0.3);
        } else {
            ctx.fillStyle = crate.color;
            ctx.fillRect(crate.x, crate.y, crate.width, crate.height);
            
            // Детали ящика
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(crate.x, crate.y, crate.width, crate.height);
            
            // Индикатор содержимого
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', crate.x + crate.width/2, crate.y + crate.height/2 + 4);
        }
    }
    
    renderDoor(ctx, door) {
        if (!door.isOpen) {
            ctx.fillStyle = door.color;
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 1;
            ctx.strokeRect(door.x, door.y, door.width, door.height);
        } else {
            // Открытая дверь (сдвинута)
            const offset = door.orientation === 'horizontal' ? { x: 0, y: -door.height } : { x: -door.width, y: 0 };
            ctx.fillStyle = door.color;
            ctx.fillRect(door.x + offset.x, door.y + offset.y, door.width, door.height);
        }
    }
    
    renderDestructibles(ctx) {
        this.destructibles.forEach(item => {
            switch(item.type) {
                case 'barrel':
                    this.renderBarrel(ctx, item);
                    break;
            }
        });
    }
    
    renderBarrel(ctx, barrel) {
        // Основная бочка
        ctx.fillStyle = barrel.color;
        ctx.fillRect(barrel.x, barrel.y, barrel.width, barrel.height);
        
        // Детали
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        ctx.strokeRect(barrel.x, barrel.y, barrel.width, barrel.height);
        
        // Предупреждающий символ
        ctx.fillStyle = '#FF0000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', barrel.x + barrel.width/2, barrel.y + barrel.height/2 + 4);
        
        // Полоска здоровья
        if (barrel.health < barrel.maxHealth) {
            const barWidth = barrel.width;
            const barHeight = 2;
            const healthPercent = barrel.health / barrel.maxHealth;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(barrel.x, barrel.y - 5, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            ctx.fillRect(barrel.x, barrel.y - 5, barWidth * healthPercent, barHeight);
        }
    }
    
    renderLighting(ctx) {
        // Создаем эффект освещения
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // Темная основа
        ctx.fillStyle = 'rgba(0, 0, 20, 0.8)';
        ctx.fillRect(0, 0, 800, 600);
        
        // Источники света
        this.lighting.forEach(light => {
            const gradient = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${light.intensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}
