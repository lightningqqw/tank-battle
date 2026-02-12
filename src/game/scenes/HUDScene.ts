import Phaser from 'phaser'
import { GameScene } from './GameScene'

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text
  private healthText!: Phaser.GameObjects.Text
  private enemiesText!: Phaser.GameObjects.Text
  private levelText!: Phaser.GameObjects.Text
  private gameScene!: GameScene
  private healthBar!: Phaser.GameObjects.Graphics
  private healthBarWidth: number = 200
  private healthBarHeight: number = 20
  private pauseButton!: Phaser.GameObjects.Text
  private isPaused: boolean = false
  
  constructor() {
    super({ key: 'HUDScene', active: true })
  }
  
  create(): void {
    // 获取 GameScene 引用
    this.gameScene = this.scene.get('GameScene') as GameScene
    
    // 创建UI背景
    this.createUIBackground()
    
    // 创建生命值条
    this.createHealthBar()
    
    // 创建文本显示
    this.createTextElements()
    
    // 创建暂停按钮
    this.createPauseButton()
    
    // 监听游戏事件
    this.setupEventListeners()
    
    // 初始更新
    this.updateHUD()
  }
  
  private createUIBackground(): void {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 0.5)
    graphics.fillRect(0, 0, this.cameras.main.width, 60)
    graphics.setDepth(1000)
  }
  
  private createHealthBar(): void {
    // 生命条背景
    const barBackground = this.add.graphics()
    barBackground.fillStyle(0x333333, 1)
    barBackground.fillRect(
      10, 
      35, 
      this.healthBarWidth, 
      this.healthBarHeight
    )
    barBackground.setDepth(1001)
    
    // 生命条
    this.healthBar = this.add.graphics()
    this.healthBar.setDepth(1002)
  }
  
  private createTextElements(): void {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }
    
    // 分数
    this.scoreText = this.add.text(220, 10, '分数: 0', style)
    this.scoreText.setDepth(1001)
    
    // 生命值
    this.healthText = this.add.text(220, 35, '生命: 100%', style)
    this.healthText.setDepth(1001)
    
    // 敌人数量
    this.enemiesText = this.add.text(400, 10, '敌人: 3', style)
    this.enemiesText.setDepth(1001)
    
    // 关卡
    this.levelText = this.add.text(400, 35, '关卡: 1', style)
    this.levelText.setDepth(1001)
  }
  
  private createPauseButton(): void {
    this.pauseButton = this.add.text(
      this.cameras.main.width - 80,
      10,
      '暂停',
      {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#ff4444',
        padding: { x: 10, y: 5 }
      }
    )
    .setDepth(1001)
    .setInteractive({ useHandCursor: true })
    
    this.pauseButton.on('pointerdown', () => {
      this.togglePause()
    })
  }
  
  private togglePause(): void {
    this.isPaused = !this.isPaused
    
    if (this.isPaused) {
      this.gameScene.scene.pause()
      this.pauseButton.setText('继续')
      this.showPauseOverlay()
    } else {
      this.gameScene.scene.resume()
      this.pauseButton.setText('暂停')
      this.hidePauseOverlay()
    }
  }
  
  private showPauseOverlay(): void {
    const overlay = this.add.rectangle(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.7
    )
    .setDepth(999)
    .setData('type', 'pauseOverlay')
    
    const pauseText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 30,
      '游戏暂停',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
      }
    )
    .setOrigin(0.5)
    .setDepth(1000)
    .setData('type', 'pauseOverlay')
    
    const continueText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 30,
      '点击任意位置继续',
      {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4
      }
    )
    .setOrigin(0.5)
    .setDepth(1000)
    .setData('type', 'pauseOverlay')
    
    // 点击任意位置继续
    this.input.once('pointerdown', () => {
      if (this.isPaused) {
        this.togglePause()
      }
    })
  }
  
  private hidePauseOverlay(): void {
    this.children.each((child: any) => {
      if (child.getData('type') === 'pauseOverlay') {
        child.destroy()
      }
    })
  }
  
  private setupEventListeners(): void {
    // 监听分数更新
    this.events.on('score_updated', (score: number) => {
      this.scoreText.setText(`分数: ${score}`)
    })
    
    // 监听生命值更新
    this.events.on('health_updated', (health: number, maxHealth: number) => {
      const percentage = Math.round((health / maxHealth) * 100)
      this.healthText.setText(`生命: ${percentage}%`)
      this.updateHealthBar(health, maxHealth)
    })
    
    // 监听敌人数量更新
    this.events.on('enemies_updated', (count: number) => {
      this.enemiesText.setText(`敌人: ${count}`)
    })
    
    // 监听关卡更新
    this.events.on('level_updated', (level: number) => {
      this.levelText.setText(`关卡: ${level}`)
    })
  }
  
  private updateHealthBar(health: number, maxHealth: number): void {
    this.healthBar.clear()
    
    const healthPercentage = health / maxHealth
    const barWidth = this.healthBarWidth * healthPercentage
    
    // 根据生命值比例设置颜色
    let color: number
    if (healthPercentage > 0.6) {
      color = 0x00ff00 // 绿色
    } else if (healthPercentage > 0.3) {
      color = 0xffff00 // 黄色
    } else {
      color = 0xff0000 // 红色
    }
    
    this.healthBar.fillStyle(color, 1)
    this.healthBar.fillRect(10, 35, barWidth, this.healthBarHeight)
  }
  
  updateHUD(): void {
    // 这里可以定期更新HUD信息
    // 实际游戏中，通常通过事件驱动更新
  }
  
  update(): void {
    // HUD场景不需要每帧更新，除非有动画效果
  }
}