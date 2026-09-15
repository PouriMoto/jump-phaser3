import { GameState } from '../data/state.js';
import { SKINS } from '../data/skins.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

export default class DashboardScene extends Phaser.Scene {
    constructor() {
        super('DashboardScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x0d1b2a);

        this.add.text(16, 20, '← بازگشت', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.scene.start('WorldMapScene'));

        this.add.text(width / 2, 20, 'داشبورد', {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.coinsText = this.add.text(width - 16, 20, `🪙 ${GameState.getCoins()}`, {
            fontSize: '20px',
            fill: '#ffe066'
        }).setOrigin(1, 0.5);

        this.buildStatsRow(50);
        this.buildSkinsSection(110);
        this.buildAchievementsSection(260);
    }

    buildStatsRow(y) {
        const { width } = this.scale;
        const stats = GameState.getStats();

        const items = [
            `🏆 رکورد: ${GameState.getHighScore()}`,
            `✅ مراحل: ${stats.levelsCompleted}`,
            `🔥 استریک: ${GameState.getStreak()} روز`
        ];

        const spacing = width / (items.length + 1);
        items.forEach((txt, i) => {
            this.add.text(spacing * (i + 1), y, txt, {
                fontSize: '15px',
                fill: '#cccccc'
            }).setOrigin(0.5);
        });
    }

    buildSkinsSection(y) {
        const { width } = this.scale;

        this.add.text(20, y, 'اسکین‌ها', {
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#ffffff'
        });

        const startX = width / 2 - (SKINS.length - 1) * 90 / 2;
        this.skinCircles = [];

        SKINS.forEach((skin, i) => {
            const x = startX + i * 90;
            const cy = y + 60;
            const owned = GameState.isSkinOwned(skin.key);
            const selected = GameState.getSkin() === skin.key;

            const box = this.add.rectangle(x, cy, 70, 70, 0x000000, owned ? 0.35 : 0.55)
                .setStrokeStyle(3, selected ? 0xffd700 : 0xffffff)
                .setInteractive({ useHandCursor: true });

            const sprite = this.add.sprite(x, cy + 4, skin.key, 4).setScale(1.3);
            if (!owned) sprite.setTint(0x555555);

            this.add.text(x, cy + 42, skin.label, {
                fontSize: '13px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            this.add.text(x, cy + 60, owned ? skin.abilityLabel : `🪙 ${skin.price}`, {
                fontSize: '11px',
                fill: owned ? '#8bc34a' : '#ffe066'
            }).setOrigin(0.5);

            box.on('pointerup', () => this.onSkinTap(skin));
            this.skinCircles.push({ skin, box });
        });
    }

    onSkinTap(skin) {
        const owned = GameState.isSkinOwned(skin.key);
        if (owned) {
            GameState.setSkin(skin.key);
            this.scene.restart();
            return;
        }

        const bought = GameState.buySkin(skin.key, skin.price);
        if (bought) {
            GameState.setSkin(skin.key);
            this.scene.restart();
        } else {
            this.showToast('سکه‌ی کافی نداری! 🪙');
        }
    }

    showToast(message) {
        const { width, height } = this.scale;
        const toast = this.add.text(width / 2, height - 90, message, {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#c62828',
            padding: { x: 14, y: 8 }
        }).setOrigin(0.5).setDepth(20);

        this.time.delayedCall(1400, () => toast.destroy());
    }

    buildAchievementsSection(y) {
        const { width } = this.scale;
        const stats = GameState.getStats();

        this.add.text(20, y, 'دستاوردها', {
            fontSize: '18px',
            fontStyle: 'bold',
            fill: '#ffffff'
        });

        const rowHeight = 34;
        ACHIEVEMENTS.forEach((ach, i) => {
            const rowY = y + 34 + i * rowHeight;
            const done = ach.check(stats);
            const progress = ach.progress(stats);

            this.add.text(24, rowY, done ? '✅' : '⬜', { fontSize: '16px' }).setOrigin(0, 0.5);
            this.add.text(52, rowY, `${ach.icon} ${ach.label}`, {
                fontSize: '14px',
                fill: done ? '#8bc34a' : '#ffffff'
            }).setOrigin(0, 0.5);
            this.add.text(width - 20, rowY, done ? 'تکمیل' : `${Math.round(progress * 100)}٪`, {
                fontSize: '13px',
                fill: '#aaaaaa'
            }).setOrigin(1, 0.5);

            const barW = 120;
            const barX = width - 180;
            this.add.rectangle(barX, rowY, barW, 6, 0x37474f).setOrigin(0, 0.5);
            this.add.rectangle(barX, rowY, barW * progress, 6, done ? 0x8bc34a : 0xffd54f).setOrigin(0, 0.5);
        });
    }
}
