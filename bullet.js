class Bullet {
    constructor(x, y, vx, vy) {
        this.x = parseFloat(x) || 0;
        this.y = parseFloat(y) || 0;
        this.vx = parseFloat(vx) || 0;
        this.vy = parseFloat(vy) || 0;
        this.radius = 4;
        this.damage = 25;
        this.life = 0;
        this.maxLife = 120;
        this.isCritical = false;
    }
    
    update(obstacles) {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        
        // Проверка столкновения с препятствиями
        if (obstacles && obstacles.length > 0) {
            const bulletRect = {
                x: this.x - this.radius,
                y: this.y - this.radius,
                width: this.radius * 2,
                height: this.radius * 2
            };
            
            for (let obstacle of obstacles) {
                if (Utils && Utils.checkCollision && Utils.checkCollision(bulletRect, obstacle)) {
                    return true;
                }
            }
        }
        
        // Проверка выхода за границы
        if (this.x < -20 || this.x > 820 || this.y < -20 || this.y > 620) {
            return true;
        }
        
        // Проверка времени жизни
        if (this.life >= this.maxLife) {
            return true;
        }
        
        return false;
    }
    
    render(ctx) {
        if (!ctx) return;
        
        ctx.save();
        
        // Цвет для критического урона
        ctx.fillStyle = this.isCritical ? '#FF0000' : '#FFFF00';
        ctx.shadowColor = this.isCritical ? '#FF0000' : '#FFFF00';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Внутренняя часть пули
        ctx.fillStyle = this.isCritical ? '#FFB6C1' : '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius - 1, 0, Math.PI * 2);
        ctx.fill();
        
        // След пули
        if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
