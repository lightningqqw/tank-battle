// scenes/GameScene.ts
import Phaser from 'phaser';
import { TankFactory } from '../patterns/factories/TankFactory';
import { BulletPool } from '../patterns/pools/BulletPool';
import { EffectPool } from '../patterns/pools/EffectPool';
import { CompositeTank, TankStateType } from '../entities/CompositeTank';
import { TankType, TankColor } from '../entities/Tank';
import { MapGenerator, MapConfig, MapData, MapTile } from '../patterns/map/MapGenerator'; 

export class GameScene extends Phaser.Scene {
    private playerTank!: CompositeTank;
    private enemyTanks: CompositeTank[] = [];
    private tankFactory!: TankFactory;
    private bulletPool!: BulletPool;
    private effectPool!: EffectPool;
    private walls!: Phaser.Physics.Arcade.StaticGroup;
    private playerKeys: any;
    private currentLevel: number = 1;
    private mapData!: MapData;
    private isGameOver: boolean = false;
    private isTransitioning: boolean = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    // 在 init 方法中接收关卡信息
    init(data: { level?: number }): void {
        if (data.level) {
            this.currentLevel = data.level;
        }
        this.isGameOver = false;
        this.isTransitioning = false;
        console.log(`GameScene init, 当前关卡: ${this.currentLevel}`);
    }

    create(): void {
        console.log('GameScene create 开始');

        // 1. 设置物理世界
        this.physics.world.setBounds(0, 0, 800, 600);

        // 2. 初始化对象池和工厂
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

        // 7. 确保 HUDScene 已经启动
        if (!this.scene.get('HUDScene')) {
            this.scene.launch('HUDScene');
        }

        // 8. 监听坦克销毁事件
        this.events.on('tank_destroyed', (data: any) => {
            // ✅ 使用简单的场景存在检查
            if (!this.scene || !this.scene.isActive()) return;
            
            console.log('坦克销毁事件:', data);
        
            if (data.type === TankType.ENEMY) {
                const index = this.enemyTanks.indexOf(data.tank);
                if (index > -1) {
                    this.enemyTanks.splice(index, 1);
                }
        
                this.events.emit('enemy_count_updated', this.enemyTanks.length);
        
                if (this.enemyTanks.length === 0 && !this.isGameOver && !this.isTransitioning) {
                    console.log('🎉 所有敌人被消灭（通过事件），胜利！');
                    this.victory();
                }
            } else if (data.type === TankType.PLAYER && !this.isGameOver && !this.isTransitioning) {
                console.log('💀 玩家死亡（通过事件），游戏结束');
                this.gameOver(false);
            }
        }, this);
        // 9. 监听玩家受伤事件并转发到 HUDScene
        this.events.on('player_health_updated', (data: any) => {
            console.log('GameScene 转发生命更新:', data);
            const hudScene = this.scene.get('HUDScene');
            if (hudScene) {
                hudScene.events.emit('player_health_updated', data);
            }
        });
        
        // 10. 初始化分数
        if (!this.registry.has('score')) {
            this.registry.set('score', 0);
        }
        this.events.emit('score_updated', this.registry.get('score'));
        this.events.emit('enemy_count_updated', this.enemyTanks.length);

        console.log('GameScene create 完成');
    }

    // 初始化对象池和工厂
    private initPoolsAndFactories(): void {
        // 1. 先初始化子弹池
        this.bulletPool = new BulletPool(this, 30);
        console.log('子弹池初始化完成');

        // 2. 再初始化特效池
        this.effectPool = new EffectPool(this, 20);
        console.log('特效池初始化完成');

        // 3. 最后初始化坦克工厂
        this.tankFactory = new TankFactory(this, this.bulletPool);
        console.log('坦克工厂初始化完成');
    }

    private createMap(): void {
        console.log(`创建随机地图，关卡: ${this.currentLevel}`);
        
        // 获取随机地图配置
        const config = MapGenerator.getRandomConfig(this.currentLevel);
        console.log('地图配置:', config);
        
        // 生成地图
        const generator = new MapGenerator(this, config);
        this.mapData = generator.generateMap();
        
        // 创建墙体组
        this.walls = this.physics.add.staticGroup();
        
        // 根据地图数据创建瓦片
        this.mapData.tiles.forEach(tile => {
            this.createTile(tile);
        });
        
        console.log(`地图创建完成，共 ${this.mapData.tiles.length} 个瓦片`);
    }
    
    private createTile(tile: MapTile): void {
        const { type, x, y, health } = tile;
        
        let textureKey = type;
        if (type === 'base') textureKey = 'steel';
        
        const wall = this.walls.create(x, y, textureKey);

        // ✅ 固定所有瓦片大小为 40x40 像素
        wall.setDisplaySize(40, 40);
        wall.refreshBody();

        wall.setData('type', type);
        wall.setData('health', health || 1);
        wall.setData('gridX', tile.gridX);
        wall.setData('gridY', tile.gridY);
        
        switch(type) {
            case 'water':
                wall.setAlpha(0.7);
                wall.setData('health', Infinity);
                wall.setDepth(1);
                break;
            case 'grass':
                wall.setAlpha(0.5);
                wall.setDepth(0);
                wall.setData('health', Infinity);
                break;
            case 'base':
                wall.setTint(0xffaa00);
                wall.setData('health', 1);
                wall.setDepth(2);
                break;
            case 'steel':
                wall.setTint(0x888888);
                break;
            case 'brick':
                wall.setTint(0xcc6600);
                break;
        }
    }

    // 修改 createPlayerTank 使用地图的出生点
    private createPlayerTank(): void {
        if (!this.mapData) return;

        const spawn = this.mapData.playerSpawn;

        this.playerTank = this.tankFactory.createTank({
            type: TankType.PLAYER,
            color: TankColor.BLUE,
            x: spawn.x,
            y: spawn.y,
            speed: 100,        // 原来是 200，变慢
            health: 100,
            damage: 20,
            fireRate: 300,
            bulletSpeed: 200   // 原来是 400，变慢
        });
        this.playerTank.setDisplaySize(50, 50);
    }

    // 修改 createEnemyTanks 使用地图的敌人出生点
    private createEnemyTanks(): void {
        if (!this.mapData) return;

        const enemyConfigs = [
            { color: TankColor.RED, speed: 60, health: 60 },    // 原来是 120
            { color: TankColor.GREEN, speed: 40, health: 80 },  // 原来是 80
            { color: TankColor.BLUE, speed: 50, health: 100 }   // 原来是 100
        ];

        // 使用地图中的敌人出生点
        this.mapData.enemySpawns.forEach((spawn, index) => {
            const config = enemyConfigs[index % enemyConfigs.length];

            const enemy = this.tankFactory.createTank({
                type: TankType.ENEMY,
                color: config.color,
                x: spawn.x,
                y: spawn.y,
                speed: config.speed,
                health: config.health
            });

            this.enemyTanks.push(enemy);
        });

        console.log(`创建了 ${this.enemyTanks.length} 个敌人坦克`);
    }

    // GameScene.ts - setupPlayerControls 方法
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
            console.log('空格键按下');
            this.handlePlayerShoot();
        });

        keys.space.on('up', () => {
            console.log('空格键释放');
        });

        this.playerKeys = { cursors, keys };
    }

    private handlePlayerShoot = (): void => {
        console.log('handlePlayerShoot 被调用');

        if (!this.playerTank?.active) {
            console.log('玩家坦克不活跃');
            return;
        }

        console.log('调用 playerTank.fire()');
        const success = this.playerTank.fire();

        if (success) {
            console.log('✅ 子弹发射成功');

            setTimeout(() => {
                const count = this.bulletPool?.getActiveCount();
                console.log(`发射后活跃子弹数: ${count}`);
            }, 50);
        } else {
            console.log('❌ 子弹发射失败');
        }
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
                const direction = new Phaser.Math.Vector2(moveX, moveY);

                if (moveX !== 0 && moveY !== 0) {
                    direction.normalize();
                }

                console.log(`Player input: (${moveX}, ${moveY}) -> direction: (${direction.x}, ${direction.y})`);
                movement.setDirection(direction);
            } else {
                movement.stop();
            }
        }
    }

    private setupCollisions(): void {
        console.log('设置碰撞...');

        if (this.playerTank && this.walls) {
            this.physics.add.collider(this.playerTank, this.walls);
        }

        if (this.enemyTanks && this.walls) {
            this.physics.add.collider(this.enemyTanks, this.walls);
        }

        if (this.playerTank && this.enemyTanks) {
            this.physics.add.collider(this.playerTank, this.enemyTanks);
        }

        if (this.enemyTanks) {
            this.physics.add.collider(this.enemyTanks, this.enemyTanks);
        }

        this.setupBulletCollisions();
    }

    private setupBulletCollisions(): void {
        console.log('设置子弹碰撞...');

        const activeBullets = this.bulletPool.getActiveBullets();

        const activeEnemies = this.enemyTanks.filter(tank => tank && tank.active && !tank.isDestroying);

        if (activeEnemies.length > 0) {
            this.physics.add.overlap(
                activeBullets,
                activeEnemies,
                (obj1: any, obj2: any) => {
                    if (obj1.active && obj2.active && !this.isGameOver && !this.isTransitioning) {
                        this.handleBulletTankCollision(obj1, obj2, TankType.PLAYER);
                    }
                },
                undefined,
                this
            );
        }

        if (this.playerTank && this.playerTank.active && !this.playerTank.isDestroying) {
            this.physics.add.overlap(
                activeBullets,
                this.playerTank,
                (obj1: any, obj2: any) => {
                    if (obj1.active && obj2.active && !this.isGameOver && !this.isTransitioning) {
                        this.handleBulletTankCollision(obj1, obj2, TankType.ENEMY);
                    }
                },
                undefined,
                this
            );
        }

        if (this.walls) {
            this.physics.add.overlap(
                activeBullets,
                this.walls,
                (obj1: any, obj2: any) => {
                    if (obj1.active && obj2.active) {
                        this.handleBulletWallCollision(obj1, obj2);
                    }
                },
                undefined,
                this
            );
        }
    }
    private handleBulletTankCollision = (obj1: any, obj2: any, expectedShooter: TankType): void => {
        if (this.isGameOver || this.isTransitioning) return;
    
        console.log('🔥 子弹-坦克碰撞触发！');
    
        const isBullet = (obj: any): boolean => {
            return obj && !obj.isDestroying && typeof obj.getShooterType === 'function' && obj.active;
        };
    
        const isTank = (obj: any): boolean => {
            return obj && !obj.isDestroying && typeof obj.takeDamage === 'function' && obj.active;
        };
    
        const bullet = isBullet(obj1) ? obj1 : (isBullet(obj2) ? obj2 : null);
        const tank = isTank(obj1) ? obj1 : (isTank(obj2) ? obj2 : null);
    
        if (!bullet || !tank) {
            console.log('无法识别子弹或坦克，可能正在销毁中');
            return;
        }
    
        const shooterType = bullet.getShooterType();
    
        if (shooterType !== expectedShooter) {
            return;
        }
    
        const damage = bullet.getDamage();
        console.log(`子弹造成伤害: ${damage}`);
    
        bullet.hit();
    
        // ✅ 坦克受伤 - 敌人和玩家都会掉血
        try {
            tank.takeDamage(damage);
        } catch (error) {
            console.error('坦克受伤时出错:', error);
        }
    
        // ✅ 只有玩家坦克受伤时才触发生命更新事件
        if (tank === this.playerTank) {
            const armor = tank.getArmor();
            if (armor) {
                const currentHealth = armor.getCurrentHealth?.() || 0;
                const maxHealth = armor.getMaxHealth?.() || 100;
                console.log(`玩家受伤，触发生命更新: ${currentHealth}/${maxHealth}`);
    
                this.events.emit('player_health_updated', {
                    current: currentHealth,
                    max: maxHealth
                });
            }
        }
        // 敌人受伤不会触发 UI 更新，但仍然会掉血
    
        // 检查坦克是否死亡
        const armor = tank.getArmor();
        if (armor && armor.getHealthPercent() <= 0) {
            console.log(`坦克死亡: ${tank.type}`);
    
            if (tank !== this.playerTank) {
                // 敌人死亡
                const index = this.enemyTanks.indexOf(tank);
                if (index > -1) {
                    this.enemyTanks.splice(index, 1);
                }
    
                const currentScore = this.registry.get('score') || 0;
                const newScore = currentScore + 100;
                this.registry.set('score', newScore);
                this.events.emit('score_updated', newScore);
                this.events.emit('enemy_count_updated', this.enemyTanks.length);
    
                console.log(`敌人被消灭，剩余: ${this.enemyTanks.length}`);
    
                if (this.enemyTanks.length === 0 && !this.isGameOver && !this.isTransitioning) {
                    console.log('🎉 所有敌人被消灭，胜利！');
                    this.victory();
                }
            } else {
                // 玩家死亡
                console.log('💀 玩家死亡，游戏结束');
                this.gameOver(false);
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

    // ✅ 新增胜利处理方法
    private victory(): void {
        if (this.isGameOver || this.isTransitioning) return;
        this.isTransitioning = true;
        
        console.log(`胜利！完成第 ${this.currentLevel} 关`);
        
        // 显示胜利信息
        const victoryText = this.add.text(400, 300, `第 ${this.currentLevel} 关完成！`, {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(1000);
        
        const nextLevelText = this.add.text(400, 380, '进入下一关...', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(1000);
        
        // 暂停物理世界
        this.physics.pause();
        
        // 延迟后进入下一关
        this.time.delayedCall(2000, () => {
            if (this.scene.isActive()) {
                this.nextLevel();
            }
        });
    }

    // ✅ 新增进入下一关方法
    private nextLevel(): void {
        console.log(`进入下一关: ${this.currentLevel + 1}`);
        
        // 清理当前场景
        this.cleanup();
        
        // 重新启动场景，关卡+1
        this.scene.restart({ level: this.currentLevel + 1 });
    }

    // ✅ 新增清理方法
    private cleanup(): void {
        // 销毁所有敌人坦克
        this.enemyTanks.forEach(tank => {
            if (tank && tank.active) {
                tank.destroy();
            }
        });
        this.enemyTanks = [];
        
        // 销毁玩家坦克
        if (this.playerTank && this.playerTank.active) {
            this.playerTank.destroy();
        }
        
        // 销毁所有墙壁
        if (this.walls) {
            this.walls.clear(true, true);
        }
        
        // 清理子弹池
        if (this.bulletPool) {
            this.bulletPool.clear();
        }
    }

    // ✅ 修改 gameOver 方法
    private gameOver(win: boolean): void {
        if (this.isGameOver || this.isTransitioning) return;
        this.isGameOver = true;
        
        console.log(`游戏结束，胜利: ${win}`);

        // 暂停物理世界
        this.physics.pause();
        
        // 暂停当前场景
        this.scene.pause();

        // 获取分数
        const score = this.registry.get('score') || 0;

        // 启动游戏结束场景
        this.scene.launch('GameOverScene', {
            win,
            score: score,
            level: this.currentLevel,
            enemiesKilled: this.getEnemiesKilled(),
            time: 0
        });

        console.log('GameOverScene 已启动');
    }

    private getEnemiesKilled(): number {
        return 3 - this.enemyTanks.length;
    }

    update(time: number, delta: number): void {
        if (this.isGameOver || this.isTransitioning) return;
        
        this.handlePlayerInput();

        if (this.playerTank?.active) {
            this.playerTank.update(time, delta);
        } else if (this.playerTank && !this.playerTank.active && !this.isGameOver && !this.isTransitioning) {
            console.log('检测到玩家坦克不活跃');
            this.gameOver(false);
        }

        this.enemyTanks = this.enemyTanks.filter(tank => {
            if (!tank.active) {
                console.log('过滤掉已销毁的敌人');
                return false;
            }
            return true;
        });

        this.enemyTanks.forEach(tank => {
            if (tank.active) {
                tank.update(time, delta);
            }
        });
    }
}