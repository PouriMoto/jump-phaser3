export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.createLoadingUI();

        // ---- تصاویر پس‌زمینه هر تم (دنیاهای فعال) ----
        this.load.image('bg_sea', 'assets/images/backgrounds/bg_sea.png');
        this.load.image('bg_jungle', 'assets/images/backgrounds/bg_jungle.png');
        // پس‌زمینه‌های دنیاهای قدیمی/آینده (برای منو و مرجع)
        this.load.image('sky_forest', 'assets/images/backgrounds/sky_forest.png');
        this.load.image('sky_cave', 'assets/images/backgrounds/sky_cave.png');
        this.load.image('sky_space', 'assets/images/backgrounds/sky_space.png');

        // ---- عناصر گیم‌پلی ----
        this.load.image('ground', 'assets/images/props/ground.png');
        this.load.image('platform_ship', 'assets/images/props/platform_ship.png');
        this.load.image('platform_jungle', 'assets/images/props/platform_jungle.png');
        this.load.image('star', 'assets/images/props/star.png');
        this.load.image('bomb', 'assets/images/props/bomb.png');

        // ---- اسکین‌های کاراکتر (هر کدام spritesheet با ۹ فریم ۳۲x۴۸) ----
        this.load.spritesheet('dude_red', 'assets/images/skins/dude_red.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('dude_blue', 'assets/images/skins/dude_blue.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('dude_green', 'assets/images/skins/dude_green.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('dude_purple', 'assets/images/skins/dude_purple.png', { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet('dude_gold', 'assets/images/skins/dude_gold.png', { frameWidth: 32, frameHeight: 48 });

        // ---- ستاره‌ی دوبل و پرچم برج ----
        this.load.image('star_double', 'assets/images/props/star_double.png');
        this.load.image('flag', 'assets/images/props/flag.png');

        // ---- موسیقی پس‌زمینه هر تم ----
        this.load.audio('music_sea', 'assets/audio/music/bg_sea.wav');
        this.load.audio('music_jungle', 'assets/audio/music/bg_jungle.wav');
        this.load.audio('music_forest', 'assets/audio/music/bg_forest.wav');
        this.load.audio('music_cave', 'assets/audio/music/bg_cave.wav');
        this.load.audio('music_space', 'assets/audio/music/bg_space.wav');

        // ---- افکت‌های صوتی ----
        this.load.audio('sfx_jump', 'assets/audio/sfx/jump.wav');
        this.load.audio('sfx_coin', 'assets/audio/sfx/coin.wav');
        this.load.audio('sfx_hit', 'assets/audio/sfx/hit.wav');
        this.load.audio('sfx_level_complete', 'assets/audio/sfx/level_complete.wav');
        this.load.audio('sfx_game_over', 'assets/audio/sfx/game_over.wav');
    }

    createLoadingUI() {
        const { width, height } = this.scale;
        const boxW = 320, boxH = 28;
        const boxX = (width - boxW) / 2, boxY = height / 2 - boxH / 2;

        this.add.rectangle(width / 2, height / 2 - 60, 500, 60, 0x000000, 0)
            .setStrokeStyle(0);

        this.add.text(width / 2, height / 2 - 60, 'در حال بارگذاری...', {
            fontSize: '28px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const outline = this.add.graphics();
        outline.lineStyle(2, 0xffffff, 1);
        outline.strokeRect(boxX, boxY, boxW, boxH);

        const bar = this.add.graphics();

        this.load.on('progress', (value) => {
            bar.clear();
            bar.fillStyle(0xffd700, 1);
            bar.fillRect(boxX + 4, boxY + 4, (boxW - 8) * value, boxH - 8);
        });
    }

    create() {
        this.scene.start('MenuScene');
    }
}
