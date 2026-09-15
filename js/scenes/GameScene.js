import { GameState } from '../data/state.js';
import { getWorld, getNextLevelRef } from '../data/worlds.js';
import { getSkin } from '../data/skins.js';
import TouchControls from '../ui/TouchControls.js';

const INVULNERABLE_FLASHES = 4;
const MAGNET_RADIUS = 100;
const MAGNET_SPEED = 220;
const DOUBLE_STAR_CHANCE = 0.12;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.worldId = data.worldId;
        this.levelIdx = data.levelIdx;
        this.world = getWorld(this.worldId);
        this.levelConfig = this.world.levels[this.levelIdx];

        this.score = 0;
        this.lives = 3;
        this.isInvulnerable = false;
        this.gameOver = false;
        this.isPaused = false;
        this.jumpsUsed = 0;
        this.prevJumpDown = false;
        this.shieldUsedThisLevel = false;
    }

    create() {
        const { width, height } = this.scale;
        const world = this.world;
        const cfg = this.levelConfig;

        this.skinDef = getSkin(GameState.getSkin());

        this.add.image(width / 2, height / 2, world.bgKey).setDisplaySize(width, height);
        this.playLevelMusic(world.musicKey);

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, world.platformKey).setScale(2).refreshBody();
        this.platforms.create(600, 400, world.platformKey);
        this.platforms.create(50, 250, world.platformKey);
        this.platforms.create(750, 220, world.platformKey);

        const skinKey = this.skinDef.key;
        this.ensureAnimations(skinKey);

        this.player = this.physics.add.sprite(100, 450, skinKey);
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.skinKey = skinKey;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.touchControls = new TouchControls(this);

        this.spawnStars(cfg);

        this.bombs = this.physics.add.group();
        for (let i = 0; i < cfg.bombCount; i++) {
            this.spawnBomb();
        }

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

        this.buildHud();
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    }

    hasAbility(name) {
        return this.skinDef.ability === name;
    }

    spawnStars(cfg) {
        this.stars = this.physics.add.group();
        for (let i = 0; i < 12; i++) {
            const x = 12 + i * 70;
            const isDouble = Math.random() < DOUBLE_STAR_CHANCE;
            const textureKey = isDouble ? 'star_double' : 'star';
            const star = this.stars.create(x, 0, textureKey);
            star.starValue = isDouble ? 2 : 1;
            star.setBounceY(Phaser.Math.FloatBetween(cfg.starBounce[0], cfg.starBounce[1]));
        }
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

    buildHud() {
        const world = this.world;

        this.add.rectangle(this.scale.width / 2, 30, this.scale.width, 60, 0x000000, 0.35).setScrollFactor(0).setDepth(9);

        this.scoreText = this.add.text(16, 12, `امتیاز: ${this.score}`, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(10);

        this.add.text(16, 38, `${world.icon} ${world.name} — مرحله ${this.levelIdx + 1} | ${this.skinDef.abilityLabel}`, {
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

    spawnBomb() {
        const cfg = this.levelConfig;
        const x = Phaser.Math.Between(0, 800);
        const bomb = this.bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(cfg.bombSpeedRange[0], cfg.bombSpeedRange[1]), 20);
        bomb.allowGravity = false;
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
            this.applyMagnet();
        }
    }

    applyMagnet() {
        this.stars.children.each((star) => {
            if (!star.active) return;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, star.x, star.y);
            if (dist < MAGNET_RADIUS) {
                this.physics.moveToObject(star, this.player, MAGNET_SPEED);
            }
        });
    }

    collectStar(player, star) {
        const value = star.starValue || 1;
        star.disableBody(true, true);

        this.score += value * 10;
        this.scoreText.setText(`امتیاز: ${this.score}`);
        GameState.recordStarCollected(value);
        this.playSfx('sfx_coin', { volume: value > 1 ? 0.7 : 0.5 });

        if (this.stars.countActive(true) === 0) {
            this.completeLevel();
        }
    }

    completeLevel() {
        this.gameOver = true;
        this.playSfx('sfx_level_complete', { volume: 0.6 });
        if (this.currentMusic) this.currentMusic.stop();

        const starsEarned = Math.max(1, Math.min(3, this.lives));
        const nextRef = getNextLevelRef(this.worldId, this.levelIdx);
        GameState.completeLevel(this.worldId, this.levelIdx, starsEarned, nextRef, { isTower: false });
        GameState.updateHighScore(this.score);

        const { width, height } = this.scale;
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55).setScrollFactor(0).setDepth(15);
        this.add.text(width / 2, height / 2 - 40, 'مرحله کامل شد!', {
            fontSize: '36px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(16);

        this.add.text(width / 2, height / 2 + 10, '⭐'.repeat(starsEarned) + '☆'.repeat(3 - starsEarned), {
            fontSize: '40px'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(16);

        this.time.delayedCall(1800, () => {
            this.scene.start('WorldMapScene');
        });
    }

    hitBomb(player, bomb) {
        if (this.isInvulnerable || this.gameOver) return;

        // قابلیت زرهی: یک ضربه‌ی رایگان در هر مرحله
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

    endGame() {
        this.gameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play(`turn_${this.player.skinKey}`);

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
        const retryBtn = makeBtn(height / 2 + 30, 'شروع مجدد مرحله', '#ef6c00', () => {
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
