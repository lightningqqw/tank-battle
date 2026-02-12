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
      bulletSpeed: 300
    })
    
    // 创建敌方坦克组
    this.createEnemyTanks()
    
    // 设置碰撞
    this.setupCollisions()
    
    // 游戏事件监听
    this.setupEvents()
  }
  
  private createMap(): void {
    this.walls = this.physics.add.staticGroup()
    
    // 创建边界墙
    this.createBoundaryWalls()
    
    // 创建随机障碍物
    this.createRandomObstacles()
  }
  
  private createBoundaryWalls(): void {
    // 顶部和底部墙
    for (let x = 0; x < this.mapWidth; x += this.tileSize) {
      this.walls.create(x, 0, 'brick').setScale(0.5).refreshBody()
      this.walls.create(x, this.mapHeight, 'brick').setScale(0.5).refreshBody()
    }
    
    // 左右墙
    for (let y = 0; y < this.mapHeight; y += this.tileSize) {
      this.walls.create(0, y, 'brick').setScale(0.5).refreshBody()
      this.walls.create(this.mapWidth, y, 'brick').setScale(0.5).refreshBody()
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
      wall.setScale(0.5).refreshBody()
      
      // 根据类型设置属性
      if (obstacle.type === 'steel') {
        wall.setData('health', 2) // 钢铁墙需要两次攻击
      } else if (obstacle.type === 'water') {
        wall.setAlpha(0.7) // 水透明效果
      }
    })
  }
  
  private createEnemyTanks(): void {
    this.enemyTanks = this.physics.add.group({
      classType: Tank,
      createCallback: (tank: Tank) => {
        tank.setData('type', 'enemy')
      }
    })
    
    // 创建3个敌方坦克
    const enemyPositions = [
      { x: 700, y: 100 },
      { x: 700, y: 300 },
      { x: 700, y: 500 }
    ]
    
    enemyPositions.forEach((pos, index) => {
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
    })
  }
  
  private setupCollisions(): void {
    // 坦克与墙碰撞
    this.physics.add.collider(this.playerTank, this.walls)
    this.physics.add.collider(this.enemyTanks, this.walls)
    
    // 坦克之间碰撞
    this.physics.add.collider(this.playerTank, this.enemyTanks)
    this.physics.add.collider(this.enemyTanks, this.enemyTanks)
    
    // 子弹碰撞检测在 Bullet 类中处理
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
        this.enemyTanks.remove(tank, true, true)
        
        // 检查是否胜利
        if (this.enemyTanks.countActive(true) === 0) {
          this.scene.pause()
          this.scene.launch('GameOverScene', { win: true })
        }
      }
    })
  }
  
  update(time: number, delta: number): void {
    // 更新玩家坦克
    this.playerTank.update(time)
    
    // 更新所有敌方坦克
    this.enemyTanks.children.iterate((enemy: any) => {
      if (enemy.active) {
        enemy.update(time)
      }
      return true
    })
  }
}