class WeaponSystem {
    constructor() {
        this.weapons = {
            pistol: {
                name: 'Пистолет',
                damage: 25,
                fireRate: 10,
                maxAmmo: 30,
                bulletSpeed: 8,
                spread: 0,
                bulletsPerShot: 1
            },
            shotgun: {
                name: 'Дробовик',
                damage: 15,
                fireRate: 30,
                maxAmmo: 8,
                bulletSpeed: 6,
                spread: 0.3,
                bulletsPerShot: 5
            },
            rifle: {
                name: 'Винтовка',
                damage: 40,
                fireRate: 20,
                maxAmmo: 20,
                bulletSpeed: 12,
                spread: 0.05,
                bulletsPerShot: 1
            },
            machinegun: {
                name: 'Пулемёт',
                damage: 20,
                fireRate: 5,
                maxAmmo: 50,
                bulletSpeed: 9,
                spread: 0.15,
                bulletsPerShot: 1
            }
        };
        
        this.currentWeapon = 'pistol';
        this.unlockedWeapons = ['pistol'];
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    switchWeapon(weaponType) {
        if (this.unlockedWeapons.includes(weaponType)) {
            this.currentWeapon = weaponType;
            return true;
        }
        return false;
    }
    
    unlockWeapon(weaponType) {
        if (!this.unlockedWeapons.includes(weaponType)) {
            this.unlockedWeapons.push(weaponType);
        }
    }
    
    shoot(x, y, angle, bullets) {
        const weapon = this.getCurrentWeapon();
        const baseAngle = angle;
        
        for (let i = 0; i < weapon.bulletsPerShot; i++) {
            const spreadAngle = baseAngle + (Math.random() - 0.5) * weapon.spread;
            const bulletVx = Math.cos(spreadAngle) * weapon.bulletSpeed;
            const bulletVy = Math.sin(spreadAngle) * weapon.bulletSpeed;
            
            const bullet = new Bullet(x, y, bulletVx, bulletVy);
            bullet.damage = weapon.damage;
            bullets.push(bullet);
        }
    }
}

class UpgradeSystem {
    constructor() {
        this.upgrades = {
            damage: { level: 0, maxLevel: 5, cost: [0, 50, 100, 200, 400], bonus: 0.2 },
            speed: { level: 0, maxLevel: 5, cost: [0, 40, 80, 160, 320], bonus: 0.15 },
            health: { level: 0, maxLevel: 5, cost: [0, 60, 120, 240, 480], bonus: 20 },
            ammo: { level: 0, maxLevel: 5, cost: [0, 30, 60, 120, 240], bonus: 10 }
        };
        
        this.currency = 0; // очки за убийства
    }
    
    addCurrency(amount) {
        this.currency += amount;
    }
    
    canUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return upgrade.level < upgrade.maxLevel && 
               this.currency >= upgrade.cost[upgrade.level + 1];
    }
    
    purchaseUpgrade(upgradeType) {
        if (this.canUpgrade(upgradeType)) {
            const upgrade = this.upgrades[upgradeType];
            this.currency -= upgrade.cost[upgrade.level + 1];
            upgrade.level++;
            return true;
        }
        return false;
    }
    
    getUpgradeBonus(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return upgrade.level * upgrade.bonus;
    }
}
