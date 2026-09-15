import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import WorldMapScene from './scenes/WorldMapScene.js';
import GameScene from './scenes/GameScene.js';
import TowerScene from './scenes/TowerScene.js';
import DashboardScene from './scenes/DashboardScene.js';
import GameOverScene from './scenes/GameOverScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, WorldMapScene, GameScene, TowerScene, DashboardScene, GameOverScene]
};

new Phaser.Game(config);
