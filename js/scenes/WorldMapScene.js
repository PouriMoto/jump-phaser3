import { WORLDS } from '../data/worlds.js';
import { GameState } from '../data/state.js';

const NODE_SPACING_Y = 130;
const ZIGZAG_AMPLITUDE = 90;
const TOP_PADDING = 130;
const BOTTOM_PADDING = 160;
const NODE_RADIUS = 34;

export default class WorldMapScene extends Phaser.Scene {
    constructor() {
        super('WorldMapScene');
    }

    create() {
        const { width } = this.scale;
        this.centerX = width / 2;

        this.buildLayout();

        const contentHeight = TOP_PADDING + this.nodes.length * NODE_SPACING_Y + BOTTOM_PADDING;
        this.cameras.main.setBounds(0, 0, width, contentHeight);
        this.physics && this.physics.world && this.physics.world.setBounds(0, 0, width, contentHeight);

        // پس‌زمینه‌ی کلی صفحه (رنگ ساده پشت مسیر)
        this.add.rectangle(width / 2, contentHeight / 2, width, contentHeight, 0x0d1b2a);

        this.drawWorldBands(contentHeight);
        this.drawPathLine();
        this.drawNodes();
        this.buildTopBar();
        this.setupScrollControls(contentHeight);
        this.scrollToCurrentProgress(contentHeight);
    }

    buildLayout() {
        this.nodes = [];
        let index = 0;
        WORLDS.forEach(world => {
            world.levels.forEach((levelCfg, levelIdx) => {
                const y = TOP_PADDING + index * NODE_SPACING_Y;
                const x = this.centerX + Math.sin(index * 0.9) * ZIGZAG_AMPLITUDE;
                this.nodes.push({ x, y, world, levelIdx, globalIndex: index });
                index++;
            });
        });
    }

    drawWorldBands(contentHeight) {
        WORLDS.forEach(world => {
            const worldNodes = this.nodes.filter(n => n.world.id === world.id);
            if (worldNodes.length === 0) return;

            const firstY = worldNodes[0].y - NODE_SPACING_Y / 2 - 10;
            const lastY = worldNodes[worldNodes.length - 1].y + NODE_SPACING_Y / 2;
            const bandColor = world.locked ? 0x37474f : world.color;

            const g = this.add.graphics();
            g.fillStyle(bandColor, world.locked ? 0.12 : 0.16);
            g.fillRoundedRect(30, firstY, this.scale.width - 60, lastY - firstY, 24);

            const label = world.locked
                ? `${world.icon} ${world.name} — به‌زودی`
                : `${world.icon} ${world.name}`;

            this.add.text(this.centerX, firstY + 26, label, {
                fontSize: '22px',
                fontStyle: 'bold',
                fill: world.locked ? '#90a4ae' : '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        });
    }

    drawPathLine() {
        const g = this.add.graphics();
        for (let i = 0; i < this.nodes.length - 1; i++) {
            const a = this.nodes[i];
            const b = this.nodes[i + 1];
            const bUnlocked = !b.world.locked && GameState.getLevelProgress(b.world.id, b.levelIdx).unlocked;
            g.lineStyle(6, bUnlocked ? 0xffd54f : 0x455a64, bUnlocked ? 0.9 : 0.5);
            g.beginPath();
            g.moveTo(a.x, a.y);
            g.lineTo(b.x, b.y);
            g.strokePath();
        }
    }

    drawNodes() {
        this.nodes.forEach(node => {
            const { world, levelIdx, x, y } = node;
            const levelDef = world.levels[levelIdx];
            const isTower = levelDef.type === 'tower';
            const progress = world.locked ? { unlocked: false, stars: 0 } : GameState.getLevelProgress(world.id, levelIdx);
            const isCompleted = progress.stars > 0;
            const isUnlocked = progress.unlocked && !world.locked;

            const fillColor = world.color;
            const radius = isTower ? NODE_RADIUS + 6 : NODE_RADIUS;

            const circle = this.add.circle(x, y, radius, fillColor, world.locked ? 0.4 : 1)
                .setStrokeStyle(4, isUnlocked || isCompleted ? 0xffffff : 0x263238);

            let label;
            if (world.locked) {
                label = '🔒';
            } else if (isCompleted) {
                label = isTower ? '🏰✓' : '✓';
            } else if (isUnlocked) {
                label = isTower ? '🏰' : `${levelIdx + 1}`;
            } else {
                label = '🔒';
            }

            this.add.text(x, y, label, {
                fontSize: isTower ? '22px' : (isCompleted ? '26px' : '22px'),
                fontStyle: 'bold',
                fill: '#ffffff'
            }).setOrigin(0.5);

            if (isCompleted) {
                const starStr = '⭐'.repeat(progress.stars) + '☆'.repeat(3 - progress.stars);
                this.add.text(x, y + radius + 16, starStr, {
                    fontSize: '14px'
                }).setOrigin(0.5);
            }

            if (isUnlocked || isCompleted) {
                circle.setInteractive({ useHandCursor: true });
                circle.on('pointerup', () => {
                    if (this.wasDragging) return;
                    const targetScene = isTower ? 'TowerScene' : 'GameScene';
                    this.scene.start(targetScene, { worldId: world.id, levelIdx });
                });
                if (isUnlocked && !isCompleted) {
                    this.tweens.add({
                        targets: circle,
                        scale: 1.08,
                        duration: 650,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        });
    }

    buildTopBar() {
        const { width } = this.scale;

        this.add.rectangle(width / 2, 36, width, 72, 0x0d1b2a, 0.95).setScrollFactor(0).setDepth(5);

        this.add.text(16, 20, '← منو', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(6)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.scene.start('MenuScene'));

        this.add.text(16, 52, '🪙 داشبورد', {
            fontSize: '15px',
            fill: '#ffe066'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(6)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.scene.start('DashboardScene'));

        this.add.text(width - 16, 20, `🪙 ${GameState.getCoins()}`, {
            fontSize: '18px',
            fill: '#ffe066'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(6);

        this.add.text(width - 16, 52, `🔥 ${GameState.getStreak()} روز`, {
            fontSize: '15px',
            fill: '#ff8a65'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(6);

        this.add.text(width / 2, 36, 'مسیر ماجراجویی', {
            fontSize: '20px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(6);
    }

    setupScrollControls(contentHeight) {
        const cam = this.cameras.main;
        const maxScroll = Math.max(0, contentHeight - cam.height);

        let dragging = false;
        let startY = 0;
        let startScroll = 0;
        this.wasDragging = false;

        this.input.on('pointerdown', (pointer) => {
            dragging = true;
            this.wasDragging = false;
            startY = pointer.y;
            startScroll = cam.scrollY;
        });

        this.input.on('pointermove', (pointer) => {
            if (!dragging) return;
            const dy = pointer.y - startY;
            if (Math.abs(dy) > 8) this.wasDragging = true;
            cam.scrollY = Phaser.Math.Clamp(startScroll - dy, 0, maxScroll);
        });

        this.input.on('pointerup', () => {
            dragging = false;
            this.time.delayedCall(50, () => { this.wasDragging = false; });
        });
        this.input.on('pointerupoutside', () => { dragging = false; });

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
            cam.scrollY = Phaser.Math.Clamp(cam.scrollY + deltaY * 0.5, 0, maxScroll);
        });
    }

    scrollToCurrentProgress(contentHeight) {
        const cam = this.cameras.main;
        const maxScroll = Math.max(0, contentHeight - cam.height);

        let target = this.nodes.find(n =>
            !n.world.locked &&
            GameState.getLevelProgress(n.world.id, n.levelIdx).unlocked &&
            GameState.getLevelProgress(n.world.id, n.levelIdx).stars === 0
        );

        if (!target) {
            const unlocked = this.nodes.filter(n =>
                !n.world.locked && GameState.getLevelProgress(n.world.id, n.levelIdx).unlocked
            );
            target = unlocked[unlocked.length - 1];
        }

        if (target) {
            cam.scrollY = Phaser.Math.Clamp(target.y - cam.height / 2, 0, maxScroll);
        }
    }
}
