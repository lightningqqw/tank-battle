import Phaser from 'phaser'
import { TankType } from './Tank'

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private speed: number = 300
  private damage: number = 10
  private shooterType: TankType
  private lifespan: number = 2000 // 子弹存在时间（毫秒）
  private bornTime: number
  
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'bullet')
    this.setScale(0.05)
    
    // 添加到场景
    scene.add.existing(this)
    scene.physics.add.existing(this)
    
    this.bornTime = scene.time.now
    this.setScale(0.05)
    this.setDepth(2)
  }
  
  fire(x: number, y: number, direction: Phaser.Math.Vector2, speed: number, shooterType: TankType): this {
    this.setPosition(x, y)
    this.setActive(true)
    this.setVisible(true)
    
    // 设置速度
    this.speed = speed
    this.shooterType = shooterType
    
    // 计算速度向量
    const velocity = direction.clone().scale(this.speed)
    this.setVelocity(velocity.x, velocity.y)
    
    // 设置旋转角度
    const angle = Math.atan2(direction.y, direction.x)
    this.setRotation(angle)
    
    // 重置生命周期
    this.bornTime = this.scene.time.now
    
    return this
  }
  
  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta)
    
    // 检查子弹生命周期
    if (time > this.bornTime + this.lifespan) {
      this.destroyBullet()
    }
    
    // 检查是否超出边界
    const camera = this.scene.cameras.main
    if (
      this.x < -50 || 
      this.x > camera.width + 50 || 
      this.y < -50 || 
      this.y > camera.height + 50
    ) {
      this.destroyBullet()
    }
  }
  
  onWallHit(wall: Phaser.GameObjects.GameObject): void {
    // 检查墙体类型
    const wallType = (wall as any).texture?.key
    
    if (wallType === 'brick') {
      // 砖墙可被破坏
      wall.destroy()
      this.scene.events.emit('wall_destroyed', wall)
    } else if (wallType === 'steel') {
      // 钢铁墙需要检查生命值
      const health = wall.getData('health') || 1
      if (health > 1) {
        wall.setData('health', health - 1)
      } else {
        wall.destroy()
        this.scene.events.emit('wall_destroyed', wall)
      }
    }
    
    this.destroyBullet()
  }
  
  onTankHit(tank: Phaser.GameObjects.GameObject): void {
    // 发射事件
    this.scene.events.emit('bullet_hit', {
      bullet: this,
      tank: tank,
      damage: this.damage
    })
    
    this.destroyBullet()
  }
  
  private destroyBullet(): void {
    // 播放命中效果
    this.playHitEffect()
    
    // 延迟销毁，让效果显示
    this.scene.time.delayedCall(50, () => {
      this.destroy()
    })
  }
  
  private playHitEffect(): void {
    // 创建命中效果
    const hitEffect = this.scene.add.particles(
      this.x,
      this.y,
      'bullet',
      {
        speed: { min: -100, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.5, end: 0 },
        lifespan: 500,
        quantity: 5,
        blendMode: 'ADD'
      }
    )
    
    // 效果播放后自动销毁
    this.scene.time.delayedCall(500, () => {
      hitEffect.destroy()
    })
  }
}