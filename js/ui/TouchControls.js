// دکمه‌های لمسی روی صفحه برای موبایل — فقط وقتی دستگاه لمسی تشخیص داده شود نمایش داده می‌شود،
// اما همیشه (حتی روی دسکتاپ) به‌عنوان پشتیبان قابل‌استفاده می‌ماند.

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.left = false;
        this.right = false;
        this.jumpPressed = false;

        const isTouch = scene.sys.game.device.input.touch;
        this.visible = isTouch;

        this.buildButtons();
    }

    buildButtons() {
        const { width, height } = this.scene.scale;
        const alpha = this.visible ? 0.45 : 0.18;
        const depth = 20;

        const btnRadius = 42;
        const margin = 70;

        // ---- دکمه چپ ----
        this.leftBtn = this.scene.add.circle(margin, height - margin, btnRadius, 0xffffff, alpha)
            .setScrollFactor(0).setDepth(depth).setInteractive();
        this.scene.add.text(margin, height - margin, '◀', { fontSize: '30px', fill: '#ffffff' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        // ---- دکمه راست ----
        this.rightBtn = this.scene.add.circle(margin + btnRadius * 2 + 20, height - margin, btnRadius, 0xffffff, alpha)
            .setScrollFactor(0).setDepth(depth).setInteractive();
        this.scene.add.text(margin + btnRadius * 2 + 20, height - margin, '▶', { fontSize: '30px', fill: '#ffffff' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        // ---- دکمه پرش ----
        this.jumpBtn = this.scene.add.circle(width - margin, height - margin, btnRadius + 6, 0xffd54f, alpha)
            .setScrollFactor(0).setDepth(depth).setInteractive();
        this.scene.add.text(width - margin, height - margin, '⬆', { fontSize: '32px', fill: '#5d4037' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

        this.leftBtn.on('pointerdown', () => { this.left = true; });
        this.leftBtn.on('pointerup', () => { this.left = false; });
        this.leftBtn.on('pointerout', () => { this.left = false; });

        this.rightBtn.on('pointerdown', () => { this.right = true; });
        this.rightBtn.on('pointerup', () => { this.right = false; });
        this.rightBtn.on('pointerout', () => { this.right = false; });

        this.jumpBtn.on('pointerdown', () => { this.jumpPressed = true; });
        this.jumpBtn.on('pointerup', () => { this.jumpPressed = false; });
        this.jumpBtn.on('pointerout', () => { this.jumpPressed = false; });
    }

    isLeftDown() {
        return this.left;
    }

    isRightDown() {
        return this.right;
    }

    isJumpDown() {
        return this.jumpPressed;
    }

    destroy() {
        [this.leftBtn, this.rightBtn, this.jumpBtn].forEach(b => b && b.destroy());
    }
}
