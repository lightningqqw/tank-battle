import Phaser from 'phaser'
import { Tank, TankType, TankColor } from '../entities/Tank'

export class GameScene extends Phaser.Scene {
  private playerTank!: Tank
  private enemyTanks!: Phaser.Physics.Arcade.Group
  private walls!: Phaser.Physics.Arcade.StaticGroup
  private mapWidth: number = 800
  private mapHeight: number = 600
  private tileSize: number = 40
  
  constructor() {
    super({ key: 'GameScene', active: true })
  }
  
  create(): void {
    console.log('GameScene create 开始')
    
    // 创建游戏世界边界
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight)
    
    // 创建地图
    this.createMap()
    
    // 创建玩家坦克
    this.playerTank = new Tank({
      scene: this,
      x: 100,
      y: this.mapHeight - 100,
      type: TankType.PLAYER,
      color: TankColor.BLUE,
      speed: 150,
      bulletSpeed: 300,
    })
    
    // 设置玩家坦克物理属性
    if (this.playerTank.body) {
      this.playerTank.body.setMass(1)
      this.playerTank.body.setDrag(0.1)
    }
    
    // 创建敌方坦克组
    this.createEnemyTanks()
    
    // 设置碰撞
    this.setupCollisions()
    
    // 游戏事件监听
    this.setupEvents()
    
    console.log('GameScene create 完成')
  }
  
  private createMap(): void {
    this.walls = this.physics.add.staticGroup()
    
    // 创建边界墙
    this.createBoundaryWalls()
    
    // 创建随机障碍物
    this.createRandomObstacles()
    
    console.log('墙壁数量:', this.walls.getChildren().length)
  }
  
  private createBoundaryWalls(): void {
    // 顶部和底部墙
    for (let x = 0; x < this.mapWidth; x += this.tileSize) {
      this.walls.create(x, 0, 'brick').setScale(0.05).refreshBody()
      this.walls.create(x, this.mapHeight, 'brick').setScale(0.05).refreshBody()
    }
    
    // 左右墙
    for (let y = 0; y < this.mapHeight; y += this.tileSize) {
      this.walls.create(0, y, 'brick').setScale(0.05).refreshBody()
      this.walls.create(this.mapWidth, y, 'brick').setScale(0.05).refreshBody()
    }
  }
  
  private createRandomObstacles(): void {
    const obstacles = [
      { x: 200, y: 200, type: 'brick' },
      { x: 300, y: 300, type: 'steel' },
      { x: 400, y: 200, type: 'brick' },
      { x: 500, y: 400, type: 'steel' },
      { x: 600, y: 300, type: 'brick' },
      { x: 350, y: 450, type: 'water' },
      { x: 450, y: 150, type: 'grass' }
    ]
    
    obstacles.forEach(obstacle => {
      const wall = this.walls.create(obstacle.x, obstacle.y, obstacle.type)
      wall.setScale(0.05).refreshBody()
      
      // 根据类型设置属性
      if (obstacle.type === 'steel') {
        wall.setData('health', 2) // 钢铁墙需要两次攻击
      } else if (obstacle.type === 'water') {
        wall.setAlpha(0.7) // 水透明效果
      } else if (obstacle.type === 'grass') {
        wall.setAlpha(0.5) // 草丛半透明
      }
    })
  }
  
  private createEnemyTanks(): void {
    console.log('开始创建敌方坦克...')
    
    // 保留 classType，这是关键！
    this.enemyTanks = this.physics.add.group({
      classType: Tank,  // 必须保留！
      createCallback: (tank: Tank) => {
        tank.setData('type', 'enemy')
        // 设置敌人坦克物理属性
        if (tank.body) {
          tank.body.setMass(1)
          tank.body.setDrag(100)  // 大摩擦力，不容易被推
          tank.body.setMaxVelocity(200)  // 限制最大速度
          tank.body.setBounce(0)  // 无反弹
        }
      }
    })
    
    // 创建3个敌方坦克
    const enemyPositions = [
      { x: 700, y: 100 },
      { x: 700, y: 300 },
      { x: 700, y: 500 }
    ]
    
    enemyPositions.forEach((pos, index) => {
      console.log(`创建敌方坦克 ${index}, 位置:`, pos)
      
      const enemy = new Tank({
        scene: this,
        x: pos.x,
        y: pos.y,
        type: TankType.ENEMY,
        color: index % 2 === 0 ? TankColor.RED : TankColor.GREEN,
        speed: 80,
        bulletSpeed: 250
      })
      
      this.enemyTanks.add(enemy)
      
      console.log(`敌方坦克 ${index} 已添加到组`)
    })
    
    console.log('敌方坦克创建完成，总数:', this.enemyTanks.getChildren().length)
  }
  
  private setupCollisions(): void {
    // 坦克与墙碰撞
    if (this.playerTank && this.walls) {
      this.physics.add.collider(
        this.playerTank, 
        this.walls,
        (tank, wall) => {
          tank.setVelocity(0, 0)  // 撞墙就停
        }
      )
    }
    
    if (this.enemyTanks && this.walls) {
      this.physics.add.collider(
        this.enemyTanks, 
        this.walls,
        (tank, wall) => {
          tank.setVelocity(0, 0)  // 撞墙就停
        }
      )
    }
    
    // 坦克之间碰撞
    if (this.playerTank && this.enemyTanks) {
      this.physics.add.collider(
        this.playerTank, 
        this.enemyTanks,
        (player, enemy) => {
          // 简单的推开逻辑
          this.physics.world.separate(player.body, enemy.body)
        }
      )
    }
    
    if (this.enemyTanks) {
      this.physics.add.collider(
        this.enemyTanks, 
        this.enemyTanks,
        (tank1, tank2) => {
          this.physics.world.separate(tank1.body, tank2.body)
        }
      )
    }
    
    // 子弹碰撞检测
    this.setupBulletCollisions()
  }
  
  private setupBulletCollisions(): void {
    // 玩家子弹 vs 敌人
    if (this.playerTank && this.playerTank.getBullets && this.enemyTanks) {
      this.physics.add.overlap(
        this.playerTank.getBullets(),
        this.enemyTanks,
        (bullet: any, enemy: any) => {
          if (bullet && bullet.active && enemy && enemy.active) {
            bullet.destroy()
            enemy.destroy()
            
            // 爆炸效果
            this.add.sprite(enemy.x, enemy.y, 'explosion').setScale(0.5)
            
            // 检查是否所有敌人都被消灭
            if (this.enemyTanks.countActive(true) === 0) {
              console.log('胜利！所有敌人都被消灭了')
              this.scene.pause()
              this.scene.launch('GameOverScene', { win: true })
            }
          }
        }
      )
    }
    
    // 敌人子弹 vs 玩家
    if (this.enemyTanks && this.playerTank) {
      this.enemyTanks.children.iterate((enemy: any) => {
        if (enemy && enemy.active && enemy.getBullets) {
          this.physics.add.overlap(
            enemy.getBullets(),
            this.playerTank,
            (bullet: any, player: any) => {
              if (bullet && bullet.active && player && player.active) {
                bullet.destroy()
                player.destroy()
                console.log('游戏结束')
                this.scene.pause()
                this.scene.launch('GameOverScene', { win: false })
              }
            }
          )
        }
        return true
      })
    }
    
    // 子弹 vs 墙
    if (this.playerTank && this.playerTank.getBullets && this.walls) {
      this.physics.add.overlap(
        this.playerTank.getBullets(),
        this.walls,
        (bullet: any, wall: any) => {
          if (bullet && bullet.active) {
            bullet.destroy()
            
            // 墙的破坏逻辑
            if (wall.texture && wall.texture.key === 'steel') {
              const health = (wall.getData('health') || 2) - 1
              wall.setData('health', health)
              
              if (health <= 0) {
                wall.destroy()
                this.add.sprite(wall.x, wall.y, 'explosion').setScale(0.5)
              }
            } else if (wall.texture && wall.texture.key === 'brick') {
              wall.destroy()
              this.add.sprite(wall.x, wall.y, 'explosion').setScale(0.3)
            }
          }
        }
      )
    }
  }
  
  private setupEvents(): void {
    // 坦克被击中事件
    this.events.on('tank_destroyed', (tank: Tank) => {
      if (tank.type === TankType.PLAYER) {
        // 游戏结束
        this.scene.pause()
        this.scene.launch('GameOverScene', { win: false })
      } else {
        // 敌方坦克被消灭
        if (this.enemyTanks) {
          this.enemyTanks.remove(tank, true, true)
          
          // 检查是否胜利
          if (this.enemyTanks.countActive(true) === 0) {
            this.scene.pause()
            this.scene.launch('GameOverScene', { win: true })
          }
        }
      }
    })
  }
  
  update(time: number, delta: number): void {
    // 更新玩家坦克
    if (this.playerTank && this.playerTank.active) {
      this.playerTank.update(time)
    }
    
    // 更新所有敌方坦克
    if (this.enemyTanks) {
      this.enemyTanks.children.iterate((enemy: any) => {
        if (enemy && enemy.active) {
          enemy.update(time)
        }
        return true
      })
    }
  }
}