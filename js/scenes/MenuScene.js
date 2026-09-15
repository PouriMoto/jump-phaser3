import { GameState } from '../data/state.js';
import { SKINS } from '../data/skins.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, 'sky_forest').setDisplaySize(width, height).setAlpha(0.9);

        this.add.text(width / 2, 70, 'ماجراجویی پرشی', {
            fontSize: '44px',
            fontStyle: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // ---- نوار سکه و استریک ----
        this.add.text(width - 16, 16, `🪙 ${GameState.getCoins()}`, {
            fontSize: '20px',
            fill: '#ffe066'
        }).setOrigin(1, 0);

        this.add.text(width - 16, 44, `🔥 ${GameState.getStreak()} روز`, {
            fontSize: '16px',
            fill: '#ff8a65'
        }).setOrigin(1, 0);

        this.add.text(width / 2, 115, `رکورد: ${GameState.getHighScore()}`, {
            fontSize: '20px',
            fill: '#ffe066'
        }).setOrigin(0.5);

        // ---- انتخاب سریع اسکین (فقط اسکین‌های خریداری‌شده) ----
        this.add.text(width / 2, 175, 'یک کاراکتر انتخاب کن:', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const ownedSkins = SKINS.filter(s => GameState.isSkinOwned(s.key));
        this.skinFrames = [];
        const startX = width / 2 - (ownedSkins.length - 1) * 90 / 2;
        ownedSkins.forEach((skin, i) => {
            const x = startX + i * 90;
            const y = 240;

            const box = this.add.rectangle(x, y, 70, 70, 0x000000, 0.35)
                .setStrokeStyle(3, 0xffffff)
                .setInteractive({ useHandCursor: true });

            this.add.sprite(x, y + 6, skin.key, 4).setScale(1.4);

            this.add.text(x, y + 45, skin.label, {
                fontSize: '14px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            box.on('pointerdown', () => {
                GameState.setSkin(skin.key);
                this.refreshSkinSelection();
            });

            this.skinFrames.push({ key: skin.key, box });
        });
        this.refreshSkinSelection();

        this.add.text(width / 2, 300, '🪙 اسکین و قابلیت‌های بیشتر در داشبورد', {
            fontSize: '13px',
            fill: '#aaaaaa'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.start('DashboardScene'));

        // ---- دکمه شروع بازی ----
        const startBtn = this.add.text(width / 2, 360, 'شروع سفر', {
            fontSize: '30px',
            fill: '#ffffff',
            backgroundColor: '#2e7d32',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startBtn.on('pointerover', () => startBtn.setStyle({ backgroundColor: '#388e3c' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ backgroundColor: '#2e7d32' }));
        startBtn.on('pointerdown', () => {
            this.scene.start('WorldMapScene');
        });

        // ---- دکمه داشبورد ----
        const dashBtn = this.add.text(width / 2, 415, '📊 داشبورد', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#1565c0',
            padding: { x: 18, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        dashBtn.on('pointerover', () => dashBtn.setStyle({ backgroundColor: '#1976d2' }));
        dashBtn.on('pointerout', () => dashBtn.setStyle({ backgroundColor: '#1565c0' }));
        dashBtn.on('pointerdown', () => this.scene.start('DashboardScene'));

        // ---- کنترل صدا ----
        this.musicToggle = this.add.text(16, 16, '', { fontSize: '18px', fill: '#ffffff' })
            .setInteractive({ useHandCursor: true });
        this.sfxToggle = this.add.text(16, 44, '', { fontSize: '18px', fill: '#ffffff' })
            .setInteractive({ useHandCursor: true });

        this.refreshSoundLabels();

        this.musicToggle.on('pointerdown', () => {
            GameState.toggleMusic();
            this.refreshSoundLabels();
        });
        this.sfxToggle.on('pointerdown', () => {
            GameState.toggleSfx();
            this.refreshSoundLabels();
        });

        this.add.text(width / 2, height - 20, 'کنترل: کلیدهای جهت‌دار یا دکمه‌های لمسی', {
            fontSize: '14px',
            fill: '#dddddd'
        }).setOrigin(0.5);

        // ---- جایزه‌ی روزانه ----
        const daily = GameState.recordDailyLogin();
        if (daily.isNewDay && daily.rewardCoins > 0) {
            this.showDailyRewardPopup(daily);
        }
    }

    showDailyRewardPopup(daily) {
        const { width, height } = this.scale;
        const group = this.add.container(0, 0).setDepth(30);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.65).setInteractive();
        const box = this.add.rectangle(width / 2, height / 2, 320, 220, 0x1b2a3a).setStrokeStyle(3, 0xffd54f);
        const title = this.add.text(width / 2, height / 2 - 70, '🎁 جایزه‌ی روزانه!', {
            fontSize: '24px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5);
        const streakTxt = this.add.text(width / 2, height / 2 - 25, `🔥 ${daily.streak} روز متوالی`, {
            fontSize: '18px',
            fill: '#ff8a65'
        }).setOrigin(0.5);
        const rewardTxt = this.add.text(width / 2, height / 2 + 15, `+${daily.rewardCoins} 🪙`, {
            fontSize: '28px',
            fontStyle: 'bold',
            fill: '#ffe066'
        }).setOrigin(0.5);
        const closeBtn = this.add.text(width / 2, height / 2 + 70, 'باشه', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#2e7d32',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerup', () => {
            group.destroy(true);
            this.scene.restart(); // برای به‌روزرسانی نمایش سکه در بالای صفحه
        });

        group.add([overlay, box, title, streakTxt, rewardTxt, closeBtn]);
    }

    refreshSkinSelection() {
        const selected = GameState.getSkin();
        this.skinFrames.forEach(f => {
            f.box.setStrokeStyle(3, f.key === selected ? 0xffd700 : 0xffffff);
        });
    }

    refreshSoundLabels() {
        this.musicToggle.setText(GameState.isMusicOn() ? '🎵 موسیقی: روشن' : '🎵 موسیقی: خاموش');
        this.sfxToggle.setText(GameState.isSfxOn() ? '🔊 افکت: روشن' : '🔊 افکت: خاموش');
    }
}
