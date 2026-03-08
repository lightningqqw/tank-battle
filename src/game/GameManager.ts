import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import { HUDScene } from '../scenes/HUDScene';
import { GameOverScene } from '../scenes/GameOverScene';

export class GameManager {
    private game: Phaser.Game;
    private static instance: GameManager;
     
    private constructor() {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#2d2d2d',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 600
            },
            scene: [BootScene, GameScene, HUDScene, GameOverScene],
            fps: {
                target: 60,
                forceSetTimeOut: false
            },
            render: {
                pixelArt: true,
                antialias: false,
                roundPixels: true
            },
            audio: {
                disableWebAudio: false
            }
        };
        
        this.game = new Phaser.Game(config);
    }
    
    // 单例模式
    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }
    
    public start(): void {
        console.log('坦克大战游戏启动 - 设计模式版本');
        console.log('已应用的设计模式:');
        console.log('- 工厂模式 (TankFactory)');
        console.log('- 对象池模式 (BulletPool, EffectPool)');
        console.log('- 组合模式 (Component系统)');
        console.log('- 状态模式 (TankState)');
        console.log('- 单例模式 (GameManager)');
    }
    
    public getGame(): Phaser.Game {
        return this.game;
    }
    
    // 游戏暂停/恢复
    public pause(): void {
        this.game.scene.pause('GameScene');
        this.game.scene.pause('HUDScene');
    }
    
    public resume(): void {
        this.game.scene.resume('GameScene');
        this.game.scene.resume('HUDScene');
    }
    
    // 重新启动
    public restart(): void {
        this.game.scene.stop('GameScene');
        this.game.scene.stop('HUDScene');
        this.game.scene.stop('GameOverScene');
        this.game.scene.start('BootScene');
    }
}