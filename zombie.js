class Zombie {
    constructor(x, y) {
        this.x = x || 400;
        this.y = y || 300;
        this.width = 18;
        this.height = 18;
        this.speed = Utils ? Utils.random(0.8, 1.5) : 1.0;
        this.maxHealth = 50;
        this.health = this.maxHealth;
        this.damage = 15;
        this.angle = 0;
        
        this.target = null;
        this.attackCooldown = 0;
        this.attackDelay = 60;
        this.detectionRange = 300; 
        this.attackRange = 30; 
        
        this.animationFrame = 0;
        this.animationSpeed = 0.2;
        
        const r = Utils ? Utils.randomInt(60, 100) : 80;
        const g = Utils ? Utils.randomInt(80, 120) : 100;
        const b = Utils ? Utils.randomInt(60, 100) : 80;
        this.bodyColor = `rgb(${r}, ${g}, ${b})`;
    }
    
    update(player, obstacles) {
        if (!player) return false; // Возвращаем false для обычных зомби
        
        this.target = player;
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        const distanceToPlayer = this.calculateDistance(player);
        
        if (distanceToPlayer <= this.detectionRange) {
            if (distanceToPlayer <= this.attackRange && this.attackCooldown === 0) {
                this.attack(player);
                return false;
            }
            
            this.moveTowards(player, obstacles);
        }
        
        this.animationFrame += this.animationSpeed;
        return false; // Обычные зомби не удаляются автоматически
    }
    
    calculateDistance(player) {
        if (Utils && Utils.distance) {
            return Utils.distance(this.x, this.y, player.x, player.y);
        }
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    moveTowards(target, obstacles) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            const newX = this.x + normalizedX * this.speed;
            const newY = this.y + normalizedY * this.speed;
            
            if (newX - this.width / 2 >= 0 && newX + this.width / 2 <= 800 &&
                newY - this.height / 2 >= 0 && newY + this.height / 2 <= 600) {
                
                let canMove = true;
                
                if (obstacles && obstacles.length > 0) {
                    const futureRect = {
                        x: newX - this.width / 2,
                        y: newY - this.height / 2,
                        width: this.width,
                        height: this.height
                    };
                    
                    obstacles.forEach(obstacle => {
                        if (this.checkCollision(futureRect, obstacle)) {
                            canMove = false;
                        }
                    });
                }
                
                if (canMove) {
                    this.x = newX;
                    this.y = newY;
                    
                    if (Utils && Utils.angle) {
                        this.angle = Utils.angle(this.x, this.y, target.x, target.y);
                    } else {
                        this.angle = Math.atan2(target.y - this.y, target.x - this.x);
                    }
                }
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        if (Utils && Utils.checkCollision) {
            return Utils.checkCollision(rect1, rect2);
        }
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    attack(player) {
        this.attackCooldown = this.attackDelay;
        
        if (player && typeof player.takeDamage === 'function') {
            player.takeDamage(this.damage);
        }
        
        if (window.game && window.game.particles && window.game.particles.createBloodParticles) {
            window.game.particles.createBloodParticles(player.x, player.y, 3);
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        
        if (window.game && window.game.particles && window.game.particles.createBloodParticles) {
            window.game.particles.createBloodParticles(this.x, this.y, 3);
        }
        
        if (this.health <= 0) {
            this.die();
            return true;
        }
        return false;
    }
    
    die() {
        if (window.game && window.game.particles && window.game.particles.createBloodParticles) {
            window.game.particles.createBloodParticles(this.x, this.y, 8);
        }
    }
    
    render(ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const wobble = Math.sin(this.animationFrame) * 2;
        
        ctx.fillStyle = this.bodyColor;
        ctx.fillRect(-this.width / 2, -this.height / 2 + wobble, this.width, this.height);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.width / 2, -this.height / 2 + wobble, this.width, this.height);
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(-this.width / 4, -this.height / 4, 3, 3);
        ctx.fillRect(this.width / 6, -this.height / 4, 3, 3);
        
        ctx.restore();
        
        if (this.health < this.maxHealth) {
            const barWidth = 20;
            const barHeight = 3;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - barWidth / 2, this.y - 15, barWidth, barHeight);
            
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x - barWidth / 2, this.y - 15, barWidth * healthPercent, barHeight);
            
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - barWidth / 2, this.y - 15, barWidth, barHeight);
        }
    }
}
