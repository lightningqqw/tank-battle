// patterns/components/WeaponComponent.ts
import { Component } from './Component';
import { BulletPool } from '../pools/BulletPool';

export class WeaponComponent extends Component {
    private damage: number;
    private fireRate: number;
    private lastShotTime: number = 0;
    private bulletSpeed: number;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 1); // 默认向下
    private bulletPool: BulletPool | null = null;

    constructor(damage: number, fireRate: number, bulletSpeed: number) {
        super('weapon');
        this.damage = damage;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
    }

    setBulletPool(pool: BulletPool): void {
        this.bulletPool = pool;
    }

    update(time: number, delta: number): void {
        // 不需要每帧更新
    }

    // patterns/components/WeaponComponent.ts
    fire(): boolean {
        console.log('WeaponComponent.fire 被调用');

        // 1. 检查 tank
        if (!this.tank) {
            console.warn('武器组件：tank 不存在');
            return false;
        }
        console.log('tank 存在:', this.tank.type);

        // 2. 检查 bulletPool
        if (!this.bulletPool) {
            console.warn('武器组件：bulletPool 不存在');
            return false;
        }
        console.log('bulletPool 存在');

        // 3. 检查冷却
        const currentTime = this.tank.scene.time.now;
        const timeSinceLastShot = currentTime - this.lastShotTime;
        console.log(`距离上次发射: ${timeSinceLastShot}ms, 冷却要求: ${this.fireRate}ms`);

        if (timeSinceLastShot < this.fireRate) {
            console.log('冷却中，不能发射');
            return false;
        }

        // 4. 从对象池获取子弹
        console.log('尝试从对象池获取子弹');
        const bullet = this.bulletPool.get();
        if (!bullet) {
            console.warn('武器组件：无法从对象池获取子弹');
            return false;
        }
        console.log('成功获取子弹');

        // 5. 计算子弹位置
        const offset = 40;
        const bulletX = this.tank.x + this.direction.x * offset;
        const bulletY = this.tank.y + this.direction.y * offset;
        console.log(`子弹位置: (${bulletX}, ${bulletY}), 方向: (${this.direction.x}, ${this.direction.y})`);

        // 6. 发射子弹
        console.log('调用 bullet.fire()');
        const success = bullet.fire(
            bulletX,
            bulletY,
            this.direction.clone(),
            this.bulletSpeed,
            this.damage,
            this.tank.type
        );

        if (success) {
            this.lastShotTime = currentTime;
            console.log('✅ 子弹发射成功，更新 lastShotTime');
            return true;
        } else {
            console.warn('❌ bullet.fire() 返回 false，回收子弹');
            this.bulletPool.release(bullet);
            return false;
        }
    }

    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'directionChanged') {
            // 接收从 MovementComponent 发来的方向更新
            this.direction = data.direction.clone();
            console.log(`Weapon: 方向更新为 (${this.direction.x}, ${this.direction.y})`);
        } else if (message === 'damageBoost') {
            this.damage *= data.factor;
        } else if (message === 'fireRateBoost') {
            this.fireRate /= data.factor;
        }
    }
}