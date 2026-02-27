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
  private keys?: {
    w: Phaser.Input.Keyboard.Key
    a: Phaser.Input.Keyboard.Key
    s: Phaser.Input.Keyboard.Key
    d: Phaser.Input.Keyboard.Key
    space: Phaser.Input.Keyboard.Key
  }
  
  constructor(config: TankConfig) {
    const { scene, x, y, type, color } = config
    const texture = `tank_${color}`
    
    super(scene, x, y, texture)
    this.setScale(0.05)
    
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
    
    // 对于单张图片，不需要创建复杂的动画
    // 只需要确保纹理存在即可
    this.verifyTexture()
  }
  
  private verifyTexture(): void {
    // 验证纹理是否成功加载
    if (!this.scene.textures.exists(this.texture.key)) {
      console.error(`Texture ${this.texture.key} not loaded!`)
    }
  }
  
  private setupPlayerControls(): void {
    this.cursors = this.scene.input.keyboard.createCursorKeys()
    
    // WASD 控制
    this.keys = {
      w: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    }
    
    // 射击事件
    this.keys.space.on('down', () => this.shoot())
  }
  
  update(time: number): void {
    if (this.type === TankType.PLAYER) {
      this.handlePlayerInput()
    } else if (this.type === TankType.ENEMY) {
      this.handleEnemyAI()
    }
  }
  
  private handlePlayerInput(): void {
    // 安全检查
    if (!this.cursors || !this.keys) return
    
    // 重置速度
    this.setVelocity(0)
    
    // 检查按键状态
    const leftPressed = this.cursors.left.isDown || this.keys.a.isDown
    const rightPressed = this.cursors.right.isDown || this.keys.d.isDown
    const upPressed = this.cursors.up.isDown || this.keys.w.isDown
    const downPressed = this.cursors.down.isDown || this.keys.s.isDown
    
    // 移动方向
    let moved = false
    
    // 水平移动
    if (leftPressed) {
      this.setVelocityX(-this.speed)
      this.rotation = -Math.PI / 2
      this.moveDirection.set(-1, 0)
      moved = true
    } else if (rightPressed) {
      this.setVelocityX(this.speed)
      this.rotation = Math.PI / 2
      this.moveDirection.set(1, 0)
      moved = true
    }
    
    // 垂直移动（可以和水平移动组合，实现8方向）
    if (upPressed) {
      this.setVelocityY(-this.speed)
      this.rotation = 0
      this.moveDirection.set(0, -1)
      moved = true
    } else if (downPressed) {
      this.setVelocityY(this.speed)
      this.rotation = Math.PI
      this.moveDirection.set(0, 1)
      moved = true
    }
    
    // 处理对角线移动的旋转（哪个方向最近按哪个）
    if (upPressed && leftPressed) {
      this.rotation = -Math.PI / 4 // -45度
      this.moveDirection.set(-0.7, -0.7).normalize()
    } else if (upPressed && rightPressed) {
      this.rotation = Math.PI / 4 // 45度
      this.moveDirection.set(0.7, -0.7).normalize()
    } else if (downPressed && leftPressed) {
      this.rotation = -3 * Math.PI / 4 // -135度
      this.moveDirection.set(-0.7, 0.7).normalize()
    } else if (downPressed && rightPressed) {
      this.rotation = 3 * Math.PI / 4 // 135度
      this.moveDirection.set(0.7, 0.7).normalize()
    }
    
    // 对于单张图片，不需要播放动画
    // 可以通过改变 tint 或 scale 来提供视觉反馈
    if (moved) {
      // 移动时稍微放大一点作为视觉反馈（可选）
      // this.setScale(1.05)
    } else {
      // 停止时恢复原始大小
      // this.setScale(1)
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
        
        // 播放音效（如果有的话）
        if (this.scene.sound.get('shot')) {
          this.scene.sound.play('shot', { volume: 0.3 })
        }
        
        this.lastShotTime = currentTime
        
        // 添加开火视觉反馈（可选）
        this.setTint(0xffaa00)
        this.scene.time.delayedCall(100, () => {
          this.clearTint()
        })
      }
    }
  }
  
  takeDamage(damage: number): void {
    // 伤害处理，可以扩展生命值系统
    this.scene.events.emit('tank_damaged', { tank: this, damage })
    
    // 受伤视觉反馈
    this.setTint(0xff0000)
    this.scene.time.delayedCall(200, () => {
      this.clearTint()
    })
  }
  
  destroy(): void {
    try {
      // 1. 首先清理事件监听（不依赖 scene）
      if (this.keys) {
        this.keys.space.off('down')
      }
      
      // 2. 检查 scene 是否存在且未销毁
      if (this.scene && !this.scene.isDestroyed) {
        
        // 3. 播放爆炸效果
        if (this.scene.textures && this.scene.textures.exists('explosion')) {
          if (this.scene.anims && this.scene.anims.exists('explode')) {
            // 使用爆炸动画
            const explosion = this.scene.add.sprite(this.x, this.y, 'explosion')
            explosion.play('explode')
            explosion.on('animationcomplete', () => {
              if (explosion && explosion.scene) {
                explosion.destroy()
              }
            })
          } else {
            // 如果没有动画，直接显示爆炸图片并淡出
            const explosion = this.scene.add.image(this.x, this.y, 'explosion')
            this.scene.tweens.add({
              targets: explosion,
              alpha: 0,
              scale: 2,
              duration: 500,
              onComplete: () => {
                if (explosion && explosion.scene) {
                  explosion.destroy()
                }
              }
            })
          }
        } else {
          // 如果没有爆炸纹理，创建一个简单的圆形效果
          try {
            const graphics = this.scene.add.graphics()
            graphics.fillStyle(0xff6600, 1)
            graphics.fillCircle(this.x, this.y, 20)
            
            this.scene.tweens.add({
              targets: graphics,
              alpha: 0,
              scale: 2,
              duration: 500,
              onComplete: () => {
                if (graphics && graphics.scene) {
                  graphics.destroy()
                }
              }
            })
          } catch (error) {
            console.warn('Could not create explosion effect:', error)
          }
        }
        
        // 4. 播放音效
        try {
          if (this.scene.sound && this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.5 })
          }
        } catch (error) {
          // 忽略音效错误
        }
      }
      
    } catch (error) {
      console.warn('Error during tank destruction:', error)
    }
    
    // 5. 最后调用父类的 destroy 方法
    try {
      super.destroy()
    } catch (error) {
      console.warn('Error in super.destroy():', error)
    }
  }
  public getBullets(): Phaser.Physics.Arcade.Group {
    return this.bullets
  }
  // 这个方法可以保留，但不再用于动画，而是用于验证
  private createAnimations(): void {
    // 这个方法现在可以为空，因为我们使用单张图片
    // 如果需要爆炸动画，可以保留
    if (!this.scene.anims.exists('explode') && this.scene.textures.exists('explosion')) {
      try {
        this.scene.anims.create({
          key: 'explode',
          frames: this.scene.anims.generateFrameNumbers('explosion', { start: 0, end: 7 }),
          frameRate: 15,
          repeat: 0,
        })
      } catch (error) {
        console.warn('Could not create explosion animation:', error)
      }
    }
  }
}