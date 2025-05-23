class AchievementSystem {
    constructor() {
        this.achievements = {
            firstKill: {
                id: 'firstKill',
                title: 'Первая кровь',
                description: 'Убейте первого зомби',
                icon: '🎯',
                unlocked: false,
                condition: (stats) => stats.kills >= 1
            },
            survivor10: {
                id: 'survivor10',
                title: 'Выживший',
                description: 'Убейте 10 зомби',
                icon: '🏆',
                unlocked: false,
                condition: (stats) => stats.kills >= 10
            },
            survivor50: {
                id: 'survivor50',
                title: 'Ветеран',
                description: 'Убейте 50 зомби',
                icon: '🎖️',
                unlocked: false,
                condition: (stats) => stats.kills >= 50
            },
            survivor100: {
                id: 'survivor100',
                title: 'Истребитель',
                description: 'Убейте 100 зомби',
                icon: '💀',
                unlocked: false,
                condition: (stats) => stats.kills >= 100
            },
            wave5: {
                id: 'wave5',
                title: 'Стойкость',
                description: 'Доживите до 5 волны',
                icon: '🌊',
                unlocked: false,
                condition: (stats) => stats.wave >= 5
            },
            wave10: {
                id: 'wave10',
                title: 'Непобедимый',
                description: 'Доживите до 10 волны',
                icon: '⚡',
                unlocked: false,
                condition: (stats) => stats.wave >= 10
            },
            headshot: {
                id: 'headshot',
                title: 'Снайпер',
                description: 'Убейте зомби одним выстрелом',
                icon: '🎯',
                unlocked: false,
                condition: (stats) => stats.oneShots >= 1
            },
            noAmmo: {
                id: 'noAmmo',
                title: 'На грани',
                description: 'Выживите без патронов 10 секунд',
                icon: '😰',
                unlocked: false,
                condition: (stats) => stats.timeWithoutAmmo >= 600
            },
            collector: {
                id: 'collector',
                title: 'Коллекционер',
                description: 'Подберите 20 предметов',
                icon: '📦',
                unlocked: false,
                condition: (stats) => stats.itemsCollected >= 20
            },
            richman: {
                id: 'richman',
                title: 'Богач',
                description: 'Накопите 500 монет',
                icon: '💰',
                unlocked: false,
                condition: (stats) => stats.totalCoins >= 500
            }
        };
        
        this.loadProgress();
    }
    
    checkAchievements(gameStats) {
        for (let achievementId in this.achievements) {
            const achievement = this.achievements[achievementId];
            
            if (!achievement.unlocked && achievement.condition(gameStats)) {
                this.unlockAchievement(achievementId);
            }
        }
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId];
        achievement.unlocked = true;
        
        this.showAchievementNotification(achievement);
        this.saveProgress();
        
        // Бонус за достижение
        if (game && game.upgradeSystem) {
            game.upgradeSystem.addCurrency(25);
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        const title = document.getElementById('achievementTitle');
        const text = document.getElementById('achievementText');
        
        title.textContent = `${achievement.icon} ${achievement.title}`;
        text.textContent = achievement.description;
        
        notification.style.display = 'block';
        
        // Скрыть через 4 секунды
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }
    
    getUnlockedCount() {
        return Object.values(this.achievements).filter(a => a.unlocked).length;
    }
    
    getTotalCount() {
        return Object.keys(this.achievements).length;
    }
    
    saveProgress() {
        const unlockedAchievements = {};
        for (let id in this.achievements) {
            unlockedAchievements[id] = this.achievements[id].unlocked;
        }
        localStorage.setItem('zombieAchievements', JSON.stringify(unlockedAchievements));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('zombieAchievements');
        if (saved) {
            const unlockedAchievements = JSON.parse(saved);
            for (let id in unlockedAchievements) {
                if (this.achievements[id]) {
                    this.achievements[id].unlocked = unlockedAchievements[id];
                }
            }
        }
    }
}
