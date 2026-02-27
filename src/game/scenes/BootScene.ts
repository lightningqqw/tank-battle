import Phaser from 'phaser'
import tankBlue from '@assets/images/tanks/tank_blue.png'
import tankRed from '@assets/images/tanks/tank_red.png'
import tankGreen from '@assets/images/tanks/tank_green.png'
import bullet from '@assets/images/bullet.png'
import brick from '@assets/images/tiles/brick.png'
import grass from '@assets/images/tiles/grass.png'
import steel from '@assets/images/tiles/steel.png'
import water from '@assets/images/tiles/water.png'
import explosion from '@assets/images/explosion.png'

import shot from "@assets/audio/shot.mp3"
import explosion1 from "@assets/audio/explosion1.mp3"
import powerup from "@assets/audio/powerup.mp3"

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }
  
  preload(): void {
    // 加载进度条
    this.createProgressBar()
    
    // 加载游戏资源
    this.loadAssets()
  }
  
  private createProgressBar(): void {
    const { width, height } = this.cameras.main
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50)
    
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0xffffff, 1)
      progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30)
    })
    
    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      this.scene.start('GameScene')
    })
  }
  
  private loadAssets(): void {
    // 坦克精灵图（示例，实际需要准备图片）
    this.load.image('tank_blue', tankBlue)
    this.load.image('tank_red', tankRed)
    this.load.image('tank_green', tankGreen)
    
    // 子弹
    this.load.image('bullet', bullet)
    
    // 地图瓦片
    this.load.image('brick', brick)
    this.load.image('steel', steel)
    this.load.image('water', water)
    this.load.image('grass', grass)
    
    // 爆炸动画
    this.load.spritesheet('explosion',explosion, {
      frameWidth: 64,
      frameHeight: 64
    })
    
    // 音效
    this.load.audio('shot', shot)
    this.load.audio('explosion', explosion1)
    this.load.audio('powerup', powerup)
  }
}