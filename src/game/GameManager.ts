import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { HUDScene } from './scenes/HUDScene'
import { GameOverScene } from './scenes/GameOverScene'

export class GameManager {
  private game: Phaser.Game
  
  constructor() {
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
          debug: false // 调试时可设为true查看碰撞框
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
        forceSetTimeOut: true
      },
      render: {
        pixelArt: false,
        antialias: true,
        roundPixels: false
      }
    }
    
    this.game = new Phaser.Game(config)
  }
  
  start(): void {
    console.log('坦克大战游戏启动')
  }
  
  getGame(): Phaser.Game {
    return this.game
  }
}