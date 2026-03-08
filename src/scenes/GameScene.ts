// scenes/GameScene.ts
import Phaser from 'phaser';
import { TankFactory } from '../patterns/factories/TankFactory';
import { BulletPool } from '../patterns/pools/BulletPool';
import { EffectPool } from '../patterns/pools/EffectPool';
import { CompositeTank, TankStateType } from '../entities/CompositeTank';
import { TankType, TankColor } from '../entities/Tank';
import { MovementComponent } from '../patterns/components/MovementComponent';

export class GameScene extends Phaser.Scene {
    private playerTank!: CompositeTank;
    private enemyTanks: CompositeTank[] = [];
    private tankFactory!: TankFactory;
    private bulletPool!: BulletPool;
    private effectPool!: EffectPool;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private playerKeys: any;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        console.log('GameScene create 开始');
        
        // 1. 设置物理世界
        this.physics.world.setBounds(0, 0, 800, 600);
        
        // 2. 初始化对象池和工厂（注意顺序！）
        this.initPoolsAndFactories();
        
        // 3. 创建地图和墙体
        this.createMap();
        
        // 4. 创建玩家和敌人坦克
        this.createPlayerTank();
        this.createEnemyTanks();
        
        // 5. 设置玩家控制
        this.setupPlayerControls();
        
        // 6. 设置所有碰撞
        this.setupCollisions();
        
        console.log('GameScene create 完成');
    }

    // 初始化对象池和工厂 - 修正顺序！
    private initPoolsAndFactories(): void {
        // 1. 先初始化子弹池（最重要！）
        this.bulletPool = new BulletPool(this, 30);
        console.log('子弹池初始化完成');
        
        // 2. 再初始化特效池
        this.effectPool = new EffectPool(this, 20);
        console.log('特效池初始化完成');
        
        // 3. 最后初始化坦克工厂（需要传入已初始化的 bulletPool）
        this.tankFactory = new TankFactory(this, this.bulletPool);
        console.log('坦克工厂初始化完成');
    }

    private createMap(): void {
        this.walls = this.physics.add.staticGroup();

        // 边界墙
        this.createBoundaryWalls();

        // 障碍物
        this.createObstacles();
    }

    private createBoundaryWalls(): void {
        const tileSize = 40;
        const { width, height } = this.physics.world.bounds;

        // 顶部
        for (let x = 0; x < width; x += tileSize) {
            const wall = this.walls.create(x, 0, 'brick');
            wall.setScale(0.05).refreshBody();
            wall.setData('health', 1);
        }

        // 底部
        for (let x = 0; x < width; x += tileSize) {
            const wall = this.walls.create(x, height, 'brick');
            wall.setScale(0.05).refreshBody();
            wall.setData('health', 1);
        }

        // 左侧
        for (let y = 0; y < height; y += tileSize) {
            const wall = this.walls.create(0, y, 'brick');
            wall.setScale(0.05).refreshBody();
            wall.setData('health', 1);
        }

        // 右侧
        for (let y = 0; y < height; y += tileSize) {
            const wall = this.walls.create(width, y, 'brick');
            wall.setScale(0.05).refreshBody();
            wall.setData('health', 1);
        }
    }

    private createObstacles(): void {
        const obstacles = [
            { x: 200, y: 200, type: 'brick', health: 1 },
            { x: 300, y: 300, type: 'steel', health: 2 },
            { x: 400, y: 200, type: 'brick', health: 1 },
            { x: 500, y: 400, type: 'steel', health: 2 },
            { x: 600, y: 300, type: 'brick', health: 1 }
        ];

        obstacles.forEach(obs => {
            const wall = this.walls.create(obs.x, obs.y, obs.type);
            wall.setScale(0.05).refreshBody();
            wall.setData('health', obs.health);
        });
    }

    private createPlayerTank(): void {
        this.playerTank = this.tankFactory.createTank({
            type: TankType.PLAYER,
            color: TankColor.BLUE,
            x: 100,
            y: 500,
            speed: 200,
            health: 100,
            damage: 20,
            fireRate: 300,
            bulletSpeed: 400
        });
    }

    private createEnemyTanks(): void {
        const enemyConfigs = [
            { color: TankColor.RED, x: 700, y: 100, speed: 120, health: 60 },
            { color: TankColor.GREEN, x: 700, y: 300, speed: 80, health: 80 },
            { color: TankColor.BLUE, x: 700, y: 500, speed: 100, health: 100 }
        ];
        
        enemyConfigs.forEach(config => {
            const enemy = this.tankFactory.createTank({
                type: TankType.ENEMY,
                color: config.color,
                x: config.x,
                y: config.y,
                speed: config.speed,
                health: config.health
            });
            
            this.enemyTanks.push(enemy);
        });
        
        console.log(`创建了 ${this.enemyTanks.length} 个敌人坦克`);
    }

    private setupPlayerControls(): void {
        const cursors = this.input.keyboard.createCursorKeys();
        const keys = {
            w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
        };
        
        // 移动使用 update 事件
        this.input.keyboard.on('update', () => {
            this.handlePlayerInput();
        });
        
        // 射击使用 down 事件
        keys.space.on('down', () => {
            if (this.playerTank?.active) {
                const success = this.playerTank.fire();
                if (success) {
                    console.log('子弹发射成功');
                }
            }
        });
        
        this.playerKeys = { cursors, keys };
    }

    private handlePlayerInput = (): void => {
        if (!this.playerTank?.active) return;
        
        const { cursors, keys } = this.playerKeys;
        
        let moveX = 0;
        let moveY = 0;
        
        if (keys.a.isDown || cursors.left.isDown) moveX -= 1;
        if (keys.d.isDown || cursors.right.isDown) moveX += 1;
        if (keys.w.isDown || cursors.up.isDown) moveY -= 1;
        if (keys.s.isDown || cursors.down.isDown) moveY += 1;
        
        const movement = this.playerTank.getMovement();
        if (movement) {
            if (moveX !== 0 || moveY !== 0) {
                const direction = new Phaser.Math.Vector2(moveX, moveY).normalize();
                movement.setDirection(direction);
            } else {
                movement.stop();
            }
        }
    }

    private setupCollisions(): void {
        console.log('设置碰撞...');
        
        // 坦克与墙碰撞
        if (this.playerTank && this.walls) {
            this.physics.add.collider(this.playerTank, this.walls);
        }
        
        if (this.enemyTanks && this.walls) {
            this.physics.add.collider(this.enemyTanks, this.walls);
        }
        
        // 坦克之间碰撞
        if (this.playerTank && this.enemyTanks) {
            this.physics.add.collider(this.playerTank, this.enemyTanks);
        }
        
        if (this.enemyTanks) {
            this.physics.add.collider(this.enemyTanks, this.enemyTanks);
        }
        
        // 子弹碰撞
        this.setupBulletCollisions();
    }

    private setupBulletCollisions(): void {
        console.log('设置子弹碰撞...');
        
        const activeBullets = this.bulletPool.getActiveBullets();
        console.log('当前活跃子弹数:', activeBullets.length);
        
        this.physics.add.overlap(
            this.bulletPool.getActiveBullets(), // 每次碰撞检测时都会重新调用这个方法！
            this.enemyTanks,
            (obj1: any, obj2: any) => {
                this.handleBulletTankCollision(obj1, obj2, TankType.PLAYER);
            },
            undefined,
            this
        );
        
        // 2. 敌人子弹 vs 玩家坦克
        this.physics.add.overlap(
            this.bulletPool.getActiveBullets(), // 每次碰撞检测时重新获取
            this.playerTank,
            (obj1: any, obj2: any) => {
                this.handleBulletTankCollision(obj1, obj2, TankType.ENEMY);
            },
            undefined,
            this
        );
        
        // 3. 子弹 vs 墙
        this.physics.add.overlap(
            this.bulletPool.getActiveBullets(), // 每次碰撞检测时重新获取
            this.walls,
            (obj1: any, obj2: any) => {
                this.handleBulletWallCollision(obj1, obj2);
            },
            undefined,
            this
        );
    }

    private handleBulletTankCollision = (obj1: any, obj2: any, expectedShooter: TankType): void => {
        console.log('🔥 子弹-坦克碰撞触发！');
        
        const isBullet = (obj: any): boolean => {
            return obj && typeof obj.getShooterType === 'function' && obj.active;
        };
        
        const isTank = (obj: any): boolean => {
            return obj && typeof obj.takeDamage === 'function' && obj.active;
        };
        
        const bullet = isBullet(obj1) ? obj1 : (isBullet(obj2) ? obj2 : null);
        const tank = isTank(obj1) ? obj1 : (isTank(obj2) ? obj2 : null);
        
        if (!bullet || !tank) {
            console.log('无法识别子弹或坦克');
            return;
        }
        
        const shooterType = bullet.getShooterType();
        console.log(`子弹类型: ${shooterType}, 期望: ${expectedShooter}, 坦克类型: ${tank.type}`);
        
        if (shooterType !== expectedShooter) {
            console.log('子弹类型不匹配，忽略');
            return;
        }
        
        const damage = bullet.getDamage();
        console.log(`子弹造成伤害: ${damage}`);
        
        // 子弹击中（播放效果）
        bullet.hit();
        
        // 坦克受伤 - 直接调用 takeDamage
        tank.takeDamage(damage);
        
        // 如果是敌人被玩家击中，检查死亡并加分
        if (expectedShooter === TankType.PLAYER && tank !== this.playerTank) {
            const armor = tank.getArmor();
            if (armor) {
                console.log(`敌人剩余生命: ${armor.getCurrentHealth?.() || 'unknown'}`);
                
                if (armor.getHealthPercent() <= 0) {
                    console.log('敌人死亡，加分');
                    const index = this.enemyTanks.indexOf(tank);
                    if (index > -1) {
                        this.enemyTanks.splice(index, 1);
                    }
                    
                    const currentScore = this.registry.get('score') || 0;
                    this.registry.set('score', currentScore + 100);
                    this.events.emit('score_updated', currentScore + 100);
                    this.events.emit('enemy_count_updated', this.enemyTanks.length);
                }
            }
        }
        
        // 如果是玩家被击中
        if (expectedShooter === TankType.ENEMY && tank === this.playerTank) {
            const armor = tank.getArmor();
            if (armor) {
                console.log(`玩家剩余生命: ${armor.getCurrentHealth?.()}`);
                
                if (armor.getHealthPercent() <= 0) {
                    console.log('玩家死亡，游戏结束');
                    this.gameOver(false);
                } else {
                    this.cameras.main.shake(100, 0.01);
                }
            }
        }
    }

    private handleBulletWallCollision = (obj1: any, obj2: any): void => {
        const isBullet = (obj: any): boolean => {
            return obj && typeof obj.hit === 'function' && obj.active;
        };
        
        const isWall = (obj: any): boolean => {
            return obj && obj.texture && (obj.texture.key === 'brick' || obj.texture.key === 'steel');
        };
        
        const bullet = isBullet(obj1) ? obj1 : (isBullet(obj2) ? obj2 : null);
        const wall = isWall(obj1) ? obj1 : (isWall(obj2) ? obj2 : null);
        
        if (!bullet || !wall) return;
        
        bullet.hit();
        
        const health = wall.getData('health') || 1;
        if (health > 1) {
            wall.setData('health', health - 1);
        } else {
            wall.destroy();
            this.createExplosion(wall.x, wall.y, 0.5);
        }
    }

    private createExplosion(x: number, y: number, scale: number = 0.5): void {
        if (this.textures.exists('explosion')) {
            const explosion = this.add.sprite(x, y, 'explosion');
            explosion.setScale(scale);
            
            if (this.anims.exists('explode')) {
                explosion.play('explode');
                explosion.once('animationcomplete', () => explosion.destroy());
            } else {
                this.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: scale * 2,
                    duration: 300,
                    onComplete: () => explosion.destroy()
                });
            }
        }
    }

    private gameOver(win: boolean): void {
        this.scene.pause();
        this.scene.launch('GameOverScene', {
            win,
            score: this.registry.get('score') || 0,
            level: 1
        });
    }

    update(time: number, delta: number): void {
        this.handlePlayerInput();
        
        if (this.playerTank?.active) {
            this.playerTank.update(time, delta);
        }
        
        this.enemyTanks.forEach(tank => {
            if (tank.active) {
                tank.update(time, delta);
            }
        });
    }
}