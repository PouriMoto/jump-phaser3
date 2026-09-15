import { GameState } from '../data/state.js';
import { getWorld, getNextLevelRef } from '../data/worlds.js';
import { getSkin } from '../data/skins.js';
import TouchControls from '../ui/TouchControls.js';

const FLOOR_HEIGHT = 140;
const TOP_PADDING = 200;
const BOTTOM_PADDING = 150;
const DOUBLE_STAR_CHANCE = 0.2;
const INVULNERABLE_FLASHES = 4;

export default class TowerScene extends Phaser.Scene {
    constructor() {
        super('TowerScene');
    }

    init(data) {
        this.worldId = data.worldId;
        this.levelIdx = data.levelIdx;
        this.world = getWorld(this.worldId);
        this.levelConfig = this.world.levels[this.levelIdx];
        this.floors = this.levelConfig.floors;

        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.isPaused = false;
        this.isInvulnerable = false;
        this.jumpsUsed = 0;
        this.prevJumpDown = false;
        this.shieldUsedThisLevel = false;
        this.highestFloor = 0;
    }

    create() {
        const { width, height } = this.scale;
        const world = this.world;

        this.skinDef = getSkin(GameState.getSkin());
        this.startY = height - BOTTOM_PADDING;
        this.contentHeight = this.startY - (this.floors * FLOOR_HEIGHT) + TOP_PADDING;
        // ارتفاع کل محتوا (از پایین شروع تا بالای برج)
        this.worldHeight = this.startY + BOTTOM_PADDING;
        this.worldTopY = this.startY - this.floors * FLOOR_HEIGHT - TOP_PADDING;

        this.physics.world.setBounds(0, this.worldTopY, width, this.worldHeight - this.worldTopY);
        this.cameras.main.setBounds(0, this.worldTopY, width, this.worldHeight - this.worldTopY);

        this.buildBackground(width, height);
        this.playLevelMusic(world.musicKey);

        this.platforms = this.physics.add.staticGroup();
        this.buildFloors(width);

        const skinKey = this.skinDef.key;
        this.ensureAnimations(skinKey);
        this.player = this.physics.add.sprite(width / 2, this.startY - 40, skinKey);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false);
        this.player.skinKey = skinKey;
        this.checkpoint = { x: width / 2, y: this.startY - 40 };

        this.cursors = this.input.keyboard.createCursorKeys();
        this.touchControls = new TouchControls(this);

        this.stars = this.physics.add.group();
        this.bombs = this.physics.add.group();
        this.buildHazardsAndBonuses(width);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        this.physics.add.overlap(this.player, this.flag, this.reachFlag, null, this);

        this.buildHud();
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    buildBackground(width, height) {
        // چند کپی از پس‌زمینه برای پوشش کل ارتفاع برج (تکرار عمودی ساده)
        const bg = this.world.bgKey;
        const totalHeight = this.worldHeight - this.worldTopY;
        const tiles = Math.ceil(totalHeight / height) + 1;
        for (let i = 0; i < tiles; i++) {
            this.add.image(width / 2, this.worldTopY + i * height + height / 2, bg).setDisplaySize(width, height);
        }
    }

    buildFloors(width) {
        // پلتفرم شروع (پهن و امن)
        this.platforms.create(width / 2, this.startY, this.world.platformKey).setScale(2).refreshBody();

        this.floorNodes = [];
        for (let i = 1; i <= this.floors; i++) {
            const y = this.startY - i * FLOOR_HEIGHT;
            const x = Phaser.Math.Clamp(width / 2 + Math.sin(i * 1.3) * 280, 90, width - 90);
            const plat = this.platforms.create(x, y, this.world.platformKey);
            plat.setDisplaySize(120, 32);
            plat.refreshBody();
            this.floorNodes.push({ floor: i, x, y });
        }
    }

    buildHazardsAndBonuses(width) {
        const cfg = this.levelConfig;
        const bombSpeed = Math.max(80, Math.abs(cfg.bombSpeedRange[1]) || 150);

        this.floorNodes.forEach(node => {
            // بمب هر ۵ طبقه (به‌جز طبقه‌ی آخر که پرچم آنجاست)
            if (node.floor % 5 === 0 && node.floor !== this.floors) {
                const dir = Math.random() < 0.5 ? -1 : 1;
                const bomb = this.bombs.create(node.x, node.y - 40, 'bomb');
                bomb.allowGravity = false;
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(bombSpeed * dir, 0);
            }

            // ستاره‌ی جایزه‌ی اختیاری بالای هر طبقه‌ی زوج
            if (node.floor % 2 === 0) {
                const isDouble = Math.random() < DOUBLE_STAR_CHANCE;
                const star = this.stars.create(node.x, node.y - 34, isDouble ? 'star_double' : 'star');
                star.starValue = isDouble ? 2 : 1;
                star.body.allowGravity = false;
                star.setImmovable(true);
            }
        });

        // پرچم روی آخرین طبقه
        const topNode = this.floorNodes[this.floorNodes.length - 1];
        this.flag = this.physics.add.staticGroup();
        const flagSprite = this.flag.create(topNode.x, topNode.y - 40, 'flag');
        flagSprite.refreshBody();
    }

    ensureAnimations(skinKey) {
        const leftKey = `left_${skinKey}`;
        if (this.anims.exists(leftKey)) return;

        this.anims.create({
            key: leftKey,
            frames: this.anims.generateFrameNumbers(skinKey, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: `turn_${skinKey}`,
            frames: [{ key: skinKey, frame: 4 }],
            frameRate: 20
        });
        this.anims.create({
            key: `right_${skinKey}`,
            frames: this.anims.generateFrameNumbers(skinKey, { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });
    }

    hasAbility(name) {
        return this.skinDef.ability === name;
    }

    buildHud() {
        const world = this.world;
        this.add.rectangle(this.scale.width / 2, 30, this.scale.width, 60, 0x000000, 0.4).setScrollFactor(0).setDepth(9);

        this.floorText = this.add.text(16, 12, `طبقه ۰ از ${this.floors}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(10);

        this.add.text(16, 38, `${world.icon} برج ${world.name}`, {
            fontSize: '14px',
            fill: '#ffe066'
        }).setScrollFactor(0).setDepth(10);

        this.livesText = this.add.text(this.scale.width - 16, 12, this.livesString(), {
            fontSize: '20px'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

        this.add.text(this.scale.width - 16, 38, '⏸ مکث', {
            fontSize: '13px',
            fill: '#cccccc'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(10)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.togglePause());
    }

    livesString() {
        let str = '❤️'.repeat(Math.max(0, this.lives));
        if (this.hasAbility('shield') && !this.shieldUsedThisLevel) str += ' 🛡️';
        return str;
    }

    playLevelMusic(musicKey) {
        this.currentMusic = this.sound.add(musicKey, { loop: true, volume: 0.5 });
        if (GameState.isMusicOn()) this.currentMusic.play();
    }

    playSfx(key, config) {
        if (GameState.isSfxOn()) this.sound.play(key, config);
    }

    update() {
        if (this.gameOver || this.isPaused) return;

        const leftDown = this.cursors.left.isDown || this.touchControls.isLeftDown();
        const rightDown = this.cursors.right.isDown || this.touchControls.isRightDown();
        const jumpDown = this.cursors.up.isDown || this.touchControls.isJumpDown();
        const baseSpeed = this.hasAbility('speedBoost') ? 192 : 160;

        if (leftDown) {
            this.player.setVelocityX(-baseSpeed);
            this.player.anims.play(`left_${this.player.skinKey}`, true);
        } else if (rightDown) {
            this.player.setVelocityX(baseSpeed);
            this.player.anims.play(`right_${this.player.skinKey}`, true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play(`turn_${this.player.skinKey}`);
        }

        if (this.player.body.touching.down) {
            this.jumpsUsed = 0;
            this.updateCheckpoint();
        }

        const jumpJustPressed = jumpDown && !this.prevJumpDown;
        this.prevJumpDown = jumpDown;
        if (jumpJustPressed) {
            const maxJumps = this.hasAbility('doubleJump') ? 2 : 1;
            if (this.jumpsUsed < maxJumps) {
                this.player.setVelocityY(-330);
                this.jumpsUsed++;
                this.playSfx('sfx_jump', { volume: 0.5 });
            }
        }

        if (this.hasAbility('magnet')) {
            this.stars.children.each((star) => {
                if (!star.active) return;
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
                if (dist < 100) {
                    star.body.allowGravity = false;
                    this.physics.moveToObject(star, this.player, 220);
                }
            });
        }

        this.updateCameraScroll();
        this.checkFallDeath();
    }

    updateCheckpoint() {
        const currentFloor = Math.max(0, Math.round((this.startY - this.player.y) / FLOOR_HEIGHT));
        if (currentFloor > this.highestFloor) {
            this.highestFloor = currentFloor;
            this.checkpoint = { x: this.player.x, y: this.player.y - 20 };
            this.floorText.setText(`طبقه ${this.highestFloor} از ${this.floors}`);
        }
    }

    updateCameraScroll() {
        const cam = this.cameras.main;
        const targetScrollY = Phaser.Math.Clamp(
            this.player.y - this.scale.height * 0.6,
            this.worldTopY,
            this.worldHeight - this.scale.height
        );
        cam.scrollY += (targetScrollY - cam.scrollY) * 0.1;
    }

    checkFallDeath() {
        const cam = this.cameras.main;
        if (this.player.y > cam.scrollY + this.scale.height + 100) {
            this.handleFall();
        }
    }

    handleFall() {
        if (this.gameOver) return;
        this.playSfx('sfx_hit', { volume: 0.5 });
        this.lives -= 1;
        this.livesText.setText(this.livesString());

        if (this.lives <= 0) {
            this.endGame();
            return;
        }

        this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
        this.player.setVelocity(0, 0);
        this.flashInvulnerable();
    }

    collectStar(player, star) {
        const value = star.starValue || 1;
        star.disableBody(true, true);
        this.score += value * 10;
        GameState.recordStarCollected(value);
        this.playSfx('sfx_coin', { volume: value > 1 ? 0.7 : 0.5 });
    }

    hitBomb(player, bomb) {
        if (this.isInvulnerable || this.gameOver) return;

        if (this.hasAbility('shield') && !this.shieldUsedThisLevel) {
            this.shieldUsedThisLevel = true;
            this.livesText.setText(this.livesString());
            this.playSfx('sfx_hit', { volume: 0.3 });
            this.flashInvulnerable();
            return;
        }

        this.playSfx('sfx_hit', { volume: 0.5 });
        this.lives -= 1;
        this.livesText.setText(this.livesString());

        if (this.lives <= 0) {
            this.endGame();
            return;
        }

        this.flashInvulnerable();
    }

    flashInvulnerable() {
        this.isInvulnerable = true;
        this.player.setTint(0xff6666);
        this.tweens.add({
            targets: this.player,
            alpha: 0.3,
            duration: 120,
            yoyo: true,
            repeat: INVULNERABLE_FLASHES,
            onComplete: () => {
                this.player.clearTint();
                this.player.setAlpha(1);
                this.isInvulnerable = false;
            }
        });
    }

    reachFlag() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.physics.pause();
        this.playSfx('sfx_level_complete', { volume: 0.7 });
        if (this.currentMusic) this.currentMusic.stop();

        const starsEarned = Math.max(1, Math.min(3, this.lives));
        const nextRef = getNextLevelRef(this.worldId, this.levelIdx);
        GameState.completeLevel(this.worldId, this.levelIdx, starsEarned, nextRef, { isTower: true });
        GameState.updateHighScore(this.score);

        const { width, height } = this.scale;
        const cam = this.cameras.main;
        const cy = cam.scrollY + height / 2;

        this.add.rectangle(width / 2, cy, width, height, 0x000000, 0.6).setDepth(15);
        this.add.text(width / 2, cy - 50, '🏰 برج فتح شد!', {
            fontSize: '34px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(16);
        this.add.text(width / 2, cy + 10, '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned), {
            fontSize: '40px'
        }).setOrigin(0.5).setDepth(16);

        this.time.delayedCall(2000, () => {
            this.scene.start('WorldMapScene');
        });
    }

    endGame() {
        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        if (this.currentMusic) this.currentMusic.stop();
        this.playSfx('sfx_game_over', { volume: 0.6 });

        this.time.delayedCall(1200, () => {
            this.scene.start('GameOverScene', {
                worldId: this.worldId,
                levelIdx: this.levelIdx,
                score: this.score
            });
        });
    }

    togglePause() {
        if (this.gameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            if (this.currentMusic) this.currentMusic.pause();
            this.showPauseMenu();
        } else {
            this.physics.resume();
            if (this.currentMusic && GameState.isMusicOn()) this.currentMusic.resume();
            if (this.pauseGroup) this.pauseGroup.destroy(true);
        }
    }

    showPauseMenu() {
        const { width, height } = this.scale;
        this.pauseGroup = this.add.container(0, 0).setScrollFactor(0).setDepth(20);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        const title = this.add.text(width / 2, height / 2 - 100, 'مکث', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const makeBtn = (y, label, color, onClick) => {
            const btn = this.add.text(width / 2, y, label, {
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: color,
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerup', onClick);
            return btn;
        };

        const resumeBtn = makeBtn(height / 2 - 30, 'ادامه', '#2e7d32', () => this.togglePause());
        const retryBtn = makeBtn(height / 2 + 30, 'شروع مجدد برج', '#ef6c00', () => {
            this.scene.restart({ worldId: this.worldId, levelIdx: this.levelIdx });
        });
        const mapBtn = makeBtn(height / 2 + 90, 'بازگشت به نقشه', '#1565c0', () => {
            this.scene.start('WorldMapScene');
        });

        this.pauseGroup.add([overlay, title, resumeBtn, retryBtn, mapBtn]);
    }

    shutdown() {
        if (this.currentMusic) this.currentMusic.stop();
        if (this.touchControls) this.touchControls.destroy();
    }
}
