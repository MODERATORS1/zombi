class ZombieFactory {
    static createZombie(type, x, y) {
        // Пока возвращаем обычного зомби, так как сложные типы могут вызывать ошибки
        return new Zombie(x, y);
    }
    
    static getRandomType(wave) {
        // Пока только базовый тип
        return 'walker';
    }
}

class BaseZombie {
    constructor(x, y, config) {
        this.x = x || 400;
        this.y = y || 300;
        this.width = config.width || 18;
        this.height = config.height || 18;
        this.speed = config.speed || 1.0;
        this.maxHealth = config.maxHealth || 50;
        this.health = this.maxHealth;
        this.damage = config.damage || 15;
        this.type = config.type || 'walker';
        this.color = config.color || '#8B4513';
        
        this.angle = 0;
        this.target = null;
        this.attackCooldown = 0;
        this.attackDelay = config.attackDelay || 60;
        this.detectionRange = config.detectionRange || 200;
        this.attackRange = config.attackRange || 25;
        
        this.animationFrame = 0;
        this.animationSpeed = 0.2;
        
        // AI состояния
        this.state = 'wander';
        this.stateTimer = 0;
        this.wanderTarget = { x: this.x, y: this.y };
        
        // Путь для навигации
        this.path = [];
        this.pathIndex = 0;
        this.lastPathUpdate = 0;
    }
    
    update(player, obstacles) {
        this.updateAI(player, obstacles);
        this.updateAnimation();
        this.updateState();
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }
    
    updateAI(player, obstacles) {
        if (!player) return;
        
        const distanceToPlayer = this.calculateDistance(player);
        
        switch(this.state) {
            case 'wander':
                this.wanderBehavior();
                if (distanceToPlayer <= this.detectionRange) {
                    this.setState('chase');
                }
                break;
                
            case 'chase':
                this.chaseBehavior(player, obstacles);
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    this.setState('wander');
                } else if (distanceToPlayer <= this.attackRange) {
                    this.setState('attack');
                }
                break;
                
            case 'attack':
                this.attackBehavior(player);
                if (distanceToPlayer > this.attackRange) {
                    this.setState('chase');
                }
                break;
        }
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }
    
    wanderBehavior() {
        const distanceToWanderTarget = Utils.distance(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
        
        if (distanceToWanderTarget < 20 || this.stateTimer > 180) {
            this.wanderTarget = {
                x: Utils.randomInt(50, 750),
                y: Utils.randomInt(50, 550)
            };
            this.stateTimer = 0;
        }
        
        this.moveTowards(this.wanderTarget, null, 0.3);
    }
    
    chaseBehavior(player, obstacles) {
        // Простая навигация с обходом препятствий
        if (this.stateTimer % 30 === 0) { // Обновляем путь каждые 30 кадров
            this.updatePath(player, obstacles);
        }
        
        if (this.path.length > this.pathIndex) {
            this.moveTowards(this.path[this.pathIndex], obstacles);
            
            const distanceToWaypoint = Utils.distance(this.x, this.y, this.path[this.pathIndex].x, this.path[this.pathIndex].y);
            if (distanceToWaypoint < 15) {
                this.pathIndex++;
            }
        } else {
            this.moveTowards(player, obstacles);
        }
    }
    
    updatePath(target, obstacles) {
        // Простая система навигации
        this.path = [];
        this.pathIndex = 0;
        
        const directDistance = Utils.distance(this.x, this.y, target.x, target.y);
        if (directDistance < 100 || !obstacles) {
            return; // Прямой путь
        }
        
        // Добавляем промежуточные точки для обхода препятствий
        const midX = (this.x + target.x) / 2;
        const midY = (this.y + target.y) / 2;
        
        // Проверяем, нужно ли обходить препятствия
        let needDetour = false;
        obstacles.forEach(obstacle => {
            if (this.lineIntersectsRect(this.x, this.y, target.x, target.y, obstacle)) {
                needDetour = true;
            }
        });
        
        if (needDetour) {
            // Добавляем точки обхода
            this.path.push({ x: midX + 30, y: midY });
            this.path.push({ x: midX, y: midY + 30 });
        }
    }
    
    lineIntersectsRect(x1, y1, x2, y2, rect) {
        // Простая проверка пересечения линии с прямоугольником
        return x1 < rect.x + rect.width && x2 > rect.x && 
               y1 < rect.y + rect.height && y2 > rect.y;
    }
    
    attackBehavior(player) {
        if (this.attackCooldown === 0) {
            this.attack(player);
        }
    }
    
    updateState() {
        this.stateTimer++;
    }
    
    // ...existing methods (moveTowards, attack, takeDamage, etc.)...
}

class WalkerZombie extends BaseZombie {
    constructor(x, y) {
        super(x, y, {
            width: 18,
            height: 18,
            speed: Utils.random(0.8, 1.2),
            maxHealth: 50,
            damage: 15,
            type: 'walker',
            color: '#8B4513',
            detectionRange: 150,
            attackRange: 25
        });
    }
}

class RunnerZombie extends BaseZombie {
    constructor(x, y) {
        super(x, y, {
            width: 16,
            height: 16,
            speed: Utils.random(1.8, 2.2),
            maxHealth: 30,
            damage: 12,
            type: 'runner',
            color: '#654321',
            detectionRange: 200,
            attackRange: 20,
            attackDelay: 45
        });
    }
}

class SpitterZombie extends BaseZombie {
    constructor(x, y) {
        super(x, y, {
            width: 20,
            height: 20,
            speed: Utils.random(0.6, 0.9),
            maxHealth: 40,
            damage: 8,
            type: 'spitter',
            color: '#9ACD32',
            detectionRange: 250,
            attackRange: 80,
            attackDelay: 90
        });
        
        this.spitCooldown = 0;
    }
    
    attackBehavior(player) {
        const distance = this.calculateDistance(player);
        
        if (distance > 40 && this.spitCooldown === 0) {
            this.spit(player);
            this.spitCooldown = 120;
        } else if (distance <= 25 && this.attackCooldown === 0) {
            this.attack(player);
        }
        
        if (this.spitCooldown > 0) {
            this.spitCooldown--;
        }
    }
    
    spit(player) {
        const angle = Utils.angle(this.x, this.y, player.x, player.y);
        const spitSpeed = 4;
        
        if (window.game && window.game.enemyProjectiles) {
            const projectile = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * spitSpeed,
                vy: Math.sin(angle) * spitSpeed,
                damage: this.damage,
                type: 'acid',
                life: 0,
                maxLife: 60
            };
            window.game.enemyProjectiles.push(projectile);
        }
    }
}

class TankZombie extends BaseZombie {
    constructor(x, y) {
        super(x, y, {
            width: 28,
            height: 28,
            speed: Utils.random(0.4, 0.6),
            maxHealth: 200,
            damage: 30,
            type: 'tank',
            color: '#2F4F4F',
            detectionRange: 120,
            attackRange: 35,
            attackDelay: 90
        });
        
        this.chargeSpeed = 3.0;
        this.isCharging = false;
        this.chargeCooldown = 0;
    }
    
    chaseBehavior(player, obstacles) {
        const distance = this.calculateDistance(player);
        
        if (distance < 100 && distance > 50 && this.chargeCooldown === 0 && !this.isCharging) {
            this.startCharge(player);
        }
        
        if (this.isCharging) {
            this.updateCharge(obstacles);
        } else {
            super.chaseBehavior(player, obstacles);
        }
        
        if (this.chargeCooldown > 0) {
            this.chargeCooldown--;
        }
    }
    
    startCharge(player) {
        this.isCharging = true;
        this.chargeTarget = { x: player.x, y: player.y };
        this.chargeTimer = 45;
    }
    
    updateCharge(obstacles) {
        if (this.chargeTimer <= 0) {
            this.isCharging = false;
            this.chargeCooldown = 180;
            return;
        }
        
        this.moveTowards(this.chargeTarget, obstacles, this.chargeSpeed);
        this.chargeTimer--;
    }
}

class ExploderZombie extends BaseZombie {
    constructor(x, y) {
        super(x, y, {
            width: 22,
            height: 22,
            speed: Utils.random(1.0, 1.4),
            maxHealth: 25,
            damage: 0,
            type: 'exploder',
            color: '#FF6347',
            detectionRange: 180,
            attackRange: 40
        });
        
        this.explosionDamage = 60;
        this.explosionRadius = 80;
        this.isExploding = false;
        this.explosionTimer = 0;
    }
    
    attackBehavior(player) {
        if (!this.isExploding) {
            this.startExplosion();
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0 && !this.isExploding) {
            this.startExplosion();
            return false; // Не удаляем сразу, ждем взрыва
        }
        
        return this.health <= 0 && !this.isExploding;
    }
    
    startExplosion() {
        this.isExploding = true;
        this.explosionTimer = 30; // 0.5 секунды до взрыва
        this.speed = 0; // Останавливаемся
    }
    
    update(player, obstacles) {
        super.update(player, obstacles);
        
        if (this.isExploding) {
            this.explosionTimer--;
            
            if (this.explosionTimer <= 0) {
                this.explode(player);
                return true; // Сигнал для удаления
            }
        }
        
        return false;
    }
    
    explode(player) {
        // Проверяем урон игроку
        const distanceToPlayer = this.calculateDistance(player);
        if (distanceToPlayer <= this.explosionRadius) {
            const damage = Math.floor(this.explosionDamage * (1 - distanceToPlayer / this.explosionRadius));
            player.takeDamage(damage);
        }
        
        // Урон другим зомби
        if (window.game && window.game.zombies) {
            window.game.zombies.forEach(zombie => {
                if (zombie !== this) {
                    const distance = Utils.distance(this.x, this.y, zombie.x, zombie.y);
                    if (distance <= this.explosionRadius) {
                        const damage = Math.floor(30 * (1 - distance / this.explosionRadius));
                        zombie.takeDamage(damage);
                    }
                }
            });
        }
        
        // Визуальный эффект взрыва
        if (window.game && window.game.particles) {
            window.game.particles.createExplosion(this.x, this.y);
        }
    }
    
    render(ctx) {
        // Мигание перед взрывом
        if (this.isExploding && Math.floor(this.explosionTimer / 5) % 2 === 0) {
            ctx.save();
            ctx.globalAlpha = 0.3;
        }
        
        super.render(ctx);
        
        if (this.isExploding && Math.floor(this.explosionTimer / 5) % 2 === 0) {
            ctx.restore();
        }
        
        // Индикатор взрыва
        if (this.isExploding) {
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionRadius * (1 - this.explosionTimer / 30), 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
