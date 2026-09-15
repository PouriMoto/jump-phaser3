import { GameState } from '../data/state.js';
import { getWorld } from '../data/worlds.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.worldId = data.worldId;
        this.levelIdx = data.levelIdx;
        this.finalScore = data.score || 0;
        this.world = getWorld(this.worldId);
    }

    create() {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2, this.world.bgKey).setDisplaySize(width, height).setAlpha(0.5);
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

        this.add.text(width / 2, height / 2 - 140, 'باختی!', {
            fontSize: '52px',
            fontStyle: 'bold',
            fill: '#ff5252',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 75, `${this.world.icon} ${this.world.name} — مرحله ${this.levelIdx + 1}`, {
            fontSize: '22px',
            fill: '#ffe066'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 - 35, `امتیاز: ${this.finalScore}`, {
            fontSize: '26px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 5, `رکورد: ${GameState.getHighScore()}`, {
            fontSize: '18px',
            fill: '#dddddd'
        }).setOrigin(0.5);

        const retryBtn = this.add.text(width / 2 - 100, height / 2 + 80, 'تلاش مجدد', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#2e7d32',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const mapBtn = this.add.text(width / 2 + 110, height / 2 + 80, 'نقشه مسیر', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#1565c0',
            padding: { x: 16, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => retryBtn.setStyle({ backgroundColor: '#388e3c' }));
        retryBtn.on('pointerout', () => retryBtn.setStyle({ backgroundColor: '#2e7d32' }));
        retryBtn.on('pointerup', () => {
            this.scene.start('GameScene', { worldId: this.worldId, levelIdx: this.levelIdx });
        });

        mapBtn.on('pointerover', () => mapBtn.setStyle({ backgroundColor: '#1976d2' }));
        mapBtn.on('pointerout', () => mapBtn.setStyle({ backgroundColor: '#1565c0' }));
        mapBtn.on('pointerup', () => {
            this.scene.start('WorldMapScene');
        });
    }
}
