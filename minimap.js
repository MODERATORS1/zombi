class Minimap {
    constructor() {
        this.canvas = document.getElementById('minimap');
        this.ctx = this.canvas.getContext('2d');
        this.scale = 0.15; // масштаб миникарты
        this.enabled = true;
    }
    
    render(gameObjects) {
        if (!this.enabled) {
            this.canvas.style.display = 'none';
            return;
        }
        
        this.canvas.style.display = 'block';
        
        // Очистка
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рамка
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Препятствия
        this.ctx.fillStyle = '#444';
        gameObjects.obstacles.forEach(obstacle => {
            if (obstacle.x >= 0 && obstacle.y >= 0) {
                this.ctx.fillRect(
                    obstacle.x * this.scale,
                    obstacle.y * this.scale,
                    obstacle.width * this.scale,
                    obstacle.height * this.scale
                );
            }
        });
        
        // Зомби
        this.ctx.fillStyle = '#FF4444';
        gameObjects.zombies.forEach(zombie => {
            this.ctx.beginPath();
            this.ctx.arc(
                zombie.x * this.scale,
                zombie.y * this.scale,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Предметы
        this.ctx.fillStyle = '#FFD700';
        gameObjects.items.forEach(item => {
            this.ctx.beginPath();
            this.ctx.arc(
                item.x * this.scale,
                item.y * this.scale,
                2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        });
        
        // Игрок
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.arc(
            gameObjects.player.x * this.scale,
            gameObjects.player.y * this.scale,
            4,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Направление игрока
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(
            gameObjects.player.x * this.scale,
            gameObjects.player.y * this.scale
        );
        this.ctx.lineTo(
            (gameObjects.player.x + Math.cos(gameObjects.player.angle) * 20) * this.scale,
            (gameObjects.player.y + Math.sin(gameObjects.player.angle) * 20) * this.scale
        );
        this.ctx.stroke();
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}
