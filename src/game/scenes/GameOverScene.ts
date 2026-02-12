import Phaser from 'phaser'

export interface GameOverData {
  win: boolean
  score: number
  level: number
}

export class GameOverScene extends Phaser.Scene {
  private resultText!: Phaser.GameObjects.Text
  private scoreText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private restartButton!: Phaser.GameObjects.Text
  private menuButton!: Phaser.GameObjects.Text
  
  constructor() {
    super({ key: 'GameOverScene' })
  }
  
  init(data: GameOverData): void {
    // 接收游戏结果数据
    this.registry.set('gameOverData', data)
  }
  
  create(): void {
    const { width, height } = this.cameras.main
    const data = this.registry.get('gameOverData') as GameOverData
    
    // 创建背景
    const background = this.add.rectangle(
      width / 2, 
      height / 2, 
      width, 
      height, 
      0x000000, 
      0.8
    )
    
    // 游戏结果文本
    const resultMessage = data.win ? '胜利!' : '游戏结束'
    const resultColor = data.win ? '#00ff00' : '#ff0000'
    
    this.resultText = this.add.text(
      width / 2,
      height / 2 - 100,
      resultMessage,
      {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: resultColor,
        stroke: '#000000',
        strokeThickness: 8
      }
    )
    .setOrigin(0.5)
    
    // 分数显示
    this.scoreText = this.add.text(
      width / 2,
      height / 2 - 20,
      `分数: ${data.score || 0}`,
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    .setOrigin(0.5)
    
    // 关卡显示
    this.levelText = this.add.text(
      width / 2,
      height / 2 + 20,
      `关卡: ${data.level || 1}`,
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    .setOrigin(0.5)
    
    // 重新开始按钮
    this.restartButton = this.add.text(
      width / 2,
      height / 2 + 80,
      '重新开始',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#4CAF50',
        padding: { x: 20, y: 10 }
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    
    // 主菜单按钮
    this.menuButton = this.add.text(
      width / 2,
      height / 2 + 130,
      '主菜单',
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        backgroundColor: '#2196F3',
        padding: { x: 20, y: 10 }
      }
    )
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    
    // 按钮事件
    this.restartButton.on('pointerdown', () => {
      this.restartGame()
    })
    
    this.menuButton.on('pointerdown', () => {
      this.returnToMenu()
    })
    
    // 添加按钮悬停效果
    this.setupButtonHoverEffects()
  }
  
  private setupButtonHoverEffects(): void {
    // 重新开始按钮悬停效果
    this.restartButton.on('pointerover', () => {
      this.restartButton.setStyle({ backgroundColor: '#45a049' })
    })
    
    this.restartButton.on('pointerout', () => {
      this.restartButton.setStyle({ backgroundColor: '#4CAF50' })
    })
    
    // 主菜单按钮悬停效果
    this.menuButton.on('pointerover', () => {
      this.menuButton.setStyle({ backgroundColor: '#0b7dda' })
    })
    
    this.menuButton.on('pointerout', () => {
      this.menuButton.setStyle({ backgroundColor: '#2196F3' })
    })
  }
  
  private restartGame(): void {
    // 停止所有场景
    this.scene.stop('HUDScene')
    this.scene.stop('GameScene')
    this.scene.stop('GameOverScene')
    
    // 重新启动游戏
    this.scene.start('BootScene')
  }
  
  private returnToMenu(): void {
    // 这里可以添加主菜单场景
    // 暂时先重启游戏
    this.restartGame()
  }
  
  update(): void {
    // 可以添加一些动画效果
  }
}