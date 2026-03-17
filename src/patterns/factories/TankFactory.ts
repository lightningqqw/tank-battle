// patterns/factories/TankFactory.ts
import { CompositeTank, TankStateType } from '../../entities/CompositeTank';
import { TankType, TankColor } from '../../entities/Tank';
import { MovementComponent } from '../components/MovementComponent';
import { WeaponComponent } from '../components/WeaponComponent';
import { ArmorComponent } from '../components/ArmorComponent';
import { PatrolState } from '../states/PatrolState';
import { ChaseState } from '../states/ChaseState';
import { AttackState } from '../states/AttackState';
import { FleeState } from '../states/FleeState';
import { DeadState } from '../states/DeadState';
import { BulletPool } from '../pools/BulletPool'; // 导入具体类型

export interface TankConfig {
    type: TankType;
    color: TankColor;
    x: number;
    y: number;
    speed?: number;
    health?: number;
    damage?: number;
    fireRate?: number;
    bulletSpeed?: number;
}

export class TankFactory {
    private scene: Phaser.Scene;
    private bulletPool: BulletPool; // 使用具体类型，不是 any

    constructor(scene: Phaser.Scene, bulletPool: BulletPool) {
        this.scene = scene;
        this.bulletPool = bulletPool;

        // 验证 bulletPool
        if (!this.bulletPool) {
            console.error('TankFactory: bulletPool 为 undefined！');
        }
    }

    createTank(config: TankConfig): CompositeTank {
        const texture = `tank_${config.color}`;

        const tank = new CompositeTank(
            this.scene,
            config.x,
            config.y,
            texture,
            config.type,
            config.color
        );

        const tankConfig = this.getConfigByType(config);

        // 添加移动组件
        tank.addComponent(new MovementComponent(tankConfig.speed));

        // 创建武器组件并设置子弹池
        const weapon = new WeaponComponent(
            tankConfig.damage,
            tankConfig.fireRate,
            tankConfig.bulletSpeed
        );

        // 设置子弹池
        if (this.bulletPool) {
            weapon.setBulletPool(this.bulletPool);
            console.log(`武器组件子弹池设置成功，坦克类型: ${config.type}`);
        } else {
            console.error(`武器组件子弹池设置失败！坦克类型: ${config.type}`);
        }

        tank.addComponent(weapon);

        // 添加装甲组件
        tank.addComponent(new ArmorComponent(tankConfig.health));

        tank.baseSpeed = tankConfig.speed;

        // 注册状态
        tank.registerState(TankStateType.PATROL, new PatrolState(tank))
            .registerState(TankStateType.CHASE, new ChaseState(tank))
            .registerState(TankStateType.ATTACK, new AttackState(tank))
            .registerState(TankStateType.FLEE, new FleeState(tank))
            .registerState(TankStateType.DEAD, new DeadState(tank));

        if (config.type === TankType.ENEMY) {
            tank.changeState(TankStateType.PATROL);
        }

        return tank;
    }

    private getConfigByType(config: TankConfig): any {
        const baseConfig = {
            speed: config.speed || 50,        // 默认速度降低
            health: config.health || 100,
            damage: config.damage || 10,
            fireRate: config.fireRate || 500,
            bulletSpeed: config.bulletSpeed || 150  // 默认子弹速度降低
        };

        console.log(`坦克配置:`, baseConfig); // 调试

        if (config.type === TankType.PLAYER) {
            return {
                ...baseConfig,
                speed: config.speed || 100,       // 玩家默认速度
                health: config.health || 100,
                damage: config.damage || 20,
                bulletSpeed: config.bulletSpeed || 200  // 玩家默认子弹速度
            };
        } else {
            switch (config.color) {
                case TankColor.RED:
                    return { ...baseConfig, speed: 60, health: 60, damage: 15, bulletSpeed: 150 };   // 速度降低
                case TankColor.GREEN:
                    return { ...baseConfig, speed: 40, health: 80, damage: 10, bulletSpeed: 150 };  // 速度降低
                default:
                    return { ...baseConfig, speed: 50, health: 100, damage: 20, bulletSpeed: 150 }; // 速度降低
            }
        }
    }
}