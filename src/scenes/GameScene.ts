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

        // 7. 监听坦克销毁事件
        this.events.on('tank_destroyed', (data: any) => {
            console.log('坦克销毁事件:', data);

            if (data.type === TankType.ENEMY) {
                // 从数组中移除
                const index = this.enemyTanks.indexOf(data.tank);
                if (index > -1) {
                    this.enemyTanks.splice(index, 1);
                }

                // 更新UI
                this.events.emit('enemy_count_updated', this.enemyTanks.length);

                // 检查胜利
                if (this.enemyTanks.length === 0) {
                    console.log('🎉 所有敌人被消灭（通过事件），胜利！');
                    this.gameOver(true);
                }
            } else if (data.type === TankType.PLAYER) {
                console.log('💀 玩家死亡（通过事件），游戏结束');
                this.gameOver(false);
            }
        });

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

        // 射击使用 down 事件 - 确保事件绑定正确
        keys.space.on('down', () => {
            console.log('空格键按下'); // 调试：检查是否触发
            this.handlePlayerShoot();
        });

        // 添加按键测试
        keys.space.on('up', () => {
            console.log('空格键释放');
        });

        this.playerKeys = { cursors, keys };
    }

    private handlePlayerShoot = (): void => {
        console.log('handlePlayerShoot 被调用'); // 调试

        if (!this.playerTank?.active) {
            console.log('玩家坦克不活跃');
            return;
        }

        console.log('调用 playerTank.fire()');
        const success = this.playerTank.fire();

        if (success) {
            console.log('✅ 子弹发射成功');

            // 延迟检查子弹池状态
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

        // 计算移动方向
        let moveX = 0;
        let moveY = 0;

        if (keys.a.isDown || cursors.left.isDown) moveX -= 1;
        if (keys.d.isDown || cursors.right.isDown) moveX += 1;
        if (keys.w.isDown || cursors.up.isDown) moveY -= 1;
        if (keys.s.isDown || cursors.down.isDown) moveY += 1;

        const movement = this.playerTank.getMovement();
        if (movement) {
            if (moveX !== 0 || moveY !== 0) {
                // 创建方向向量并归一化
                const direction = new Phaser.Math.Vector2(moveX, moveY);

                // 对角线移动时保持速度一致
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

        // 过滤掉正在销毁的坦克
        const activeEnemies = this.enemyTanks.filter(tank => tank && tank.active && !tank.isDestroying);

        // 1. 玩家子弹 vs 敌人坦克
        if (activeEnemies.length > 0) {
            this.physics.add.overlap(
                activeBullets,
                activeEnemies,
                (obj1: any, obj2: any) => {
                    // 再次检查对象是否还活跃
                    if (obj1.active && obj2.active) {
                        this.handleBulletTankCollision(obj1, obj2, TankType.PLAYER);
                    }
                },
                undefined,
                this
            );
        }

        // 2. 敌人子弹 vs 玩家坦克
        if (this.playerTank && this.playerTank.active && !this.playerTank.isDestroying) {
            this.physics.add.overlap(
                activeBullets,
                this.playerTank,
                (obj1: any, obj2: any) => {
                    if (obj1.active && obj2.active) {
                        this.handleBulletTankCollision(obj1, obj2, TankType.ENEMY);
                    }
                },
                undefined,
                this
            );
        }

        // 3. 子弹 vs 墙
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

        // 子弹击中
        bullet.hit();

        // 坦克受伤 - 使用 try-catch 防止错误
        try {
            tank.takeDamage(damage);
        } catch (error) {
            console.error('坦克受伤时出错:', error);
        }

        // 检查坦克是否死亡
        const armor = tank.getArmor();
        if (armor && armor.getHealthPercent() <= 0) {
            console.log(`坦克死亡: ${tank.type}`);

            // 如果是敌人被玩家消灭
            if (tank !== this.playerTank) {
                // 从敌人数组中移除
                const index = this.enemyTanks.indexOf(tank);
                if (index > -1) {
                    this.enemyTanks.splice(index, 1);
                }

                // 加分
                const currentScore = this.registry.get('score') || 0;
                this.registry.set('score', currentScore + 100);
                this.events.emit('score_updated', currentScore + 100);
                this.events.emit('enemy_count_updated', this.enemyTanks.length);

                console.log(`敌人被消灭，剩余: ${this.enemyTanks.length}`);

                // 检查是否胜利
                if (this.enemyTanks.length === 0) {
                    console.log('🎉 所有敌人被消灭，胜利！');
                    this.gameOver(true);
                }
            }
            // 如果是玩家被消灭
            else {
                console.log('💀 玩家死亡，游戏结束');
                this.gameOver(false);
            }
        }
    }

    // 确保 gameOver 方法正确
    private gameOver(win: boolean): void {
        console.log(`游戏结束，胜利: ${win}`);

        // 暂停当前场景
        this.scene.pause();

        // 获取分数
        const score = this.registry.get('score') || 0;

        // 启动游戏结束场景
        this.scene.launch('GameOverScene', {
            win,
            score: score,
            level: 1,
            enemiesKilled: 3 - this.enemyTanks.length,
            time: 0
        });

        console.log('GameOverScene 已启动');
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


    update(time: number, delta: number): void {
        this.handlePlayerInput();

        if (this.playerTank?.active) {
            this.playerTank.update(time, delta);
        } else if (this.playerTank && !this.playerTank.active) {
            // 玩家坦克被销毁但不活跃
            console.log('检测到玩家坦克不活跃');
            this.gameOver(false);
        }

        // 过滤掉已销毁的敌人
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

        // 检查胜利条件
        if (this.enemyTanks.length === 0) {
            console.log('敌人数组为空，胜利！');
            this.gameOver(true);
        }
    }
}