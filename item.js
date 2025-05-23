class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 16;
        this.height = 16;
        this.animationFrame = 0;
        this.animationSpeed = 0.1;
        
        if (type === 'health') {
            this.color = '#FF4444';
            this.symbol = '+';
            this.value = 30;
        } else if (type === 'ammo') {
            this.color = '#FFD700';
            this.symbol = '●';
            this.value = 15;
        } else if (type === 'weapon') {
            this.color = '#00FF00';
            this.symbol = 'W';
            this.value = 1;
        }
    }
    
    update() {
        this.animationFrame += this.animationSpeed;
    }
    
    checkPickup(player) {
        const distance = Utils.distance(this.x, this.y, player.x, player.y);
        if (distance < 20) {
            this.applyEffect(player);
            return true;
        }
        return false;
    }
    
    applyEffect(player) {
        if (this.type === 'health') {
            player.heal(this.value);
        } else if (this.type === 'ammo') {
            player.addAmmo(this.value);
        } else if (this.type === 'weapon') {
            // Логика получения оружия обрабатывается в карте
        }
    }
    
    render(ctx) {
        const bounce = Math.sin(this.animationFrame * 2) * 3;
        
        // Тень
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - this.width / 2, this.y + this.height / 2, this.width, 4);
        
        // Предмет
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.width / 2, 
            this.y - this.height / 2 + bounce, 
            this.width, 
            this.height
        );
        
        // Символ
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.symbol, 
            this.x, 
            this.y + 4 + bounce
        );
    }
}
