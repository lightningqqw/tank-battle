import Phaser from 'phaser'
import { Bullet } from './Bullet'

export enum TankType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY'
}

export enum TankColor {
  BLUE = 'blue',
  RED = 'red',
  GREEN = 'green'
}

export interface TankConfig {
  scene: Phaser.Scene
  x: number
  y: number
  type: TankType
  color: TankColor
  speed: number
  bulletSpeed: number
}

export class Tank extends Phaser.Physics.Arcade.Sprite {
  public type: TankType
  public color: TankColor
  private speed: number
  private bulletSpeed: number
  private lastShotTime: number = 0
  private shotCooldown: number = 500 // 毫秒
  private bullets: Phaser.Physics.Arcade.Group
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private moveDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -1)
  
  constructor(config: TankConfig) {
    const { scene, x, y, type, color } = config
    const texture = `tank_${color}`
    
    super(scene, x, y, texture)
    
    this.type = type
    this.color = color
    this.speed = config.speed
    this.bulletSpeed = config.bulletSpeed
    
    // 添加到场景
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    // 设置物理属性
    this.setCollideWorldBounds(true)
    this.setImmovable(false)
    this.setBounce(0)
    this.setDepth(1)
    
    // 创建子弹组
    this.bullets = scene.physics.add.group({
      classType: Bullet,
      maxSize: 10,
      runChildUpdate: true
    })
    
    // 如果是玩家坦克，设置控制
    if (this.type === TankType.PLAYER) {
      this.setupPlayerControls()
    }
    
    // 创建动画
    this.createAnimations()
  }
  
  private setupPlayerControls(): void {
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    
    // WASD 控制（备用）
    const keyW = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)
    const keyA = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
    const keyS = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
    const keyD = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    const space = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    
    // 射击事件
    space.on('down', () => this.shoot())
  }
  
  update(time: number): void {
    if (this.type === TankType.PLAYER && this.cursors) {
      this.handlePlayerInput()
    } else if (this.type === TankType.ENEMY) {
      this.handleEnemyAI()
    }
  }
  
  private handlePlayerInput(): void {
    // 重置速度
    this.setVelocity(0)
    
    // 方向控制
    let moved = false
    
    if (this.cursors!.left.isDown || this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('A'))) {
      this.setVelocityX(-this.speed)
      this.rotation = -Math.PI / 2
      this.moveDirection.set(-1, 0)
      moved = true
    } else if (this.cursors!.right.isDown || this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('D'))) {
      this.setVelocityX(this.speed)
      this.rotation = Math.PI / 2
      this.moveDirection.set(1, 0)
      moved = true
    }
    
    if (this.cursors!.up.isDown || this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('W'))) {
      this.setVelocityY(-this.speed)
      this.rotation = 0
      this.moveDirection.set(0, -1)
      moved = true
    } else if (this.cursors!.down.isDown || this.scene.input.keyboard.checkDown(this.scene.input.keyboard.addKey('S'))) {
      this.setVelocityY(this.speed)
      this.rotation = Math.PI
      this.moveDirection.set(0, 1)
      moved = true
    }
    
    // 动画
    if (moved) {
      this.play('tank_move', true)
    } else {
      this.play('tank_idle', true)
    }
  }
  
  private handleEnemyAI(): void {
    // 简单的敌方AI - 随机移动和射击
    if (Math.random() < 0.02) {
      const directions = [
        { x: 0, y: -1, rotation: 0 },
        { x: 1, y: 0, rotation: Math.PI / 2 },
        { x: 0, y: 1, rotation: Math.PI },
        { x: -1, y: 0, rotation: -Math.PI / 2 }
      ]
      
      const dir = Phaser.Utils.Array.GetRandom(directions)
      this.moveDirection.set(dir.x, dir.y)
      this.rotation = dir.rotation
    }
    
    this.setVelocity(this.moveDirection.x * this.speed, this.moveDirection.y * this.speed)
    
    // 随机射击
    if (Math.random() < 0.01) {
      this.shoot()
    }
  }
  
  shoot(): void {
    const currentTime = this.scene.time.now
    
    if (currentTime - this.lastShotTime > this.shotCooldown) {
      const bullet = this.bullets.get() as Bullet
      
      if (bullet) {
        const offset = 30
        const bulletX = this.x + this.moveDirection.x * offset
        const bulletY = this.y + this.moveDirection.y * offset
        
        bullet.fire(bulletX, bulletY, this.moveDirection, this.bulletSpeed, this.type)
        
        // 播放音效
        this.scene.sound.play('shot', { volume: 0.3 })
        
        this.lastShotTime = currentTime
      }
    }
  }
  
  takeDamage(damage: number): void {
    // 伤害处理，可以扩展生命值系统
    this.scene.events.emit('tank_damaged', { tank: this, damage })
  }
  
  destroy(): void {
    // 播放爆炸动画
    const explosion = this.scene.add.sprite(this.x, this.y, 'explosion')
    explosion.play('explode')
    
    // 播放音效
    this.scene.sound.play('explosion', { volume: 0.5 })
    
    // 延迟后销毁
    this.scene.time.delayedCall(500, () => {
      explosion.destroy()
    })
    
    super.destroy()
  }
  
  private createAnimations(): void {
    if (!this.scene.anims.exists('tank_move')) {
      this.scene.anims.create({
        key: 'tank_move',
        frames: this.scene.anims.generateFrameNumbers(`tank_${this.color}`, { start: 0, end: 1 }),
        frameRate: 10,
        repeat: -1
      })
    }
    
    if (!this.scene.anims.exists('tank_idle')) {
      this.scene.anims.create({
        key: 'tank_idle',
        frames: [{ key: `tank_${this.color}`, frame: 0 }],
        frameRate: 10
      })
    }
    
    if (!this.scene.anims.exists('explode')) {
      this.scene.anims.create({
        key: 'explode',
        frames: this.scene.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
        frameRate: 15,
        repeat: 0
      })
    }
  }
}