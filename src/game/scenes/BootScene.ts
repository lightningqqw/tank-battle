import Phaser from 'phaser'

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
    this.load.image('tank_blue', '/assets/images/tanks/tank_blue.png')
    this.load.image('tank_red', '/assets/images/tanks/tank_red.png')
    this.load.image('tank_green', '/assets/images/tanks/tank_green.png')
    
    // 子弹
    this.load.image('bullet', '/assets/images/bullet.png')
    
    // 地图瓦片
    this.load.image('brick', '/assets/images/tiles/brick.png')
    this.load.image('steel', '/assets/images/tiles/steel.png')
    this.load.image('water', '/assets/images/tiles/water.png')
    this.load.image('grass', '/assets/images/tiles/grass.png')
    
    // 爆炸动画
    this.load.spritesheet('explosion', '/assets/images/explosion.png', {
      frameWidth: 64,
      frameHeight: 64
    })
    
    // 音效
    this.load.audio('shot', '/assets/audio/shot.mp3')
    this.load.audio('explosion', '/assets/audio/explosion.mp3')
    this.load.audio('powerup', '/assets/audio/powerup.mp3')
  }
}