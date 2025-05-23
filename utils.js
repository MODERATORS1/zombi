// Вспомогательные функции
class Utils {
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    static checkCollision(rect1, rect2) {
        if (!rect1 || !rect2) return false;
        
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

// Система частиц для эффектов
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    createBloodParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-3, 3),
                vy: Utils.random(-3, 3),
                life: 0,
                maxLife: Utils.randomInt(30, 60),
                size: Utils.random(2, 5),
                color: `rgb(${Utils.randomInt(150, 200)}, 0, 0)`
            });
        }
    }
    
    createMuzzleFlash(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-2, 2),
                life: 0,
                maxLife: 15,
                size: Utils.random(3, 8),
                color: `rgb(255, ${Utils.randomInt(200, 255)}, 0)`
            });
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = Utils.random(3, 8);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: Utils.randomInt(40, 80),
                size: Utils.random(4, 12),
                color: `rgb(255, ${Utils.randomInt(100, 200)}, 0)`
            });
        }
    }
    
    createItemParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Utils.random(-2, 2),
                vy: Utils.random(-4, -1),
                life: 0,
                maxLife: 60,
                size: Utils.random(2, 4),
                color: '#FFD700'
            });
        }
    }
    
    update() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life++;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            particle.vy += 0.1; // Гравитация
            
            return particle.life < particle.maxLife;
        });
    }
    
    render(ctx) {
        if (!ctx) return;
        
        this.particles.forEach(particle => {
            const alpha = 1 - (particle.life / particle.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
}
