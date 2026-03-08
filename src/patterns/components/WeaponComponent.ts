// patterns/components/WeaponComponent.ts
import { Component } from './Component';
import { BulletPool } from '../pools/BulletPool';

export class WeaponComponent extends Component {
    private damage: number;
    private fireRate: number;
    private lastShotTime: number = 0;
    private bulletSpeed: number;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -1);
    private bulletPool: BulletPool | null = null;
    
    constructor(damage: number, fireRate: number, bulletSpeed: number) {
        super('weapon');
        this.damage = damage;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
    }
    
    setBulletPool(pool: BulletPool): void {
        this.bulletPool = pool;
        console.log('武器组件收到子弹池');
    }
    
    // ✅ 实现抽象方法 update
    update(time: number, delta: number): void {
        // 武器组件可以在这里处理冷却时间更新
        // 目前不需要每帧更新，但必须实现抽象方法
        // 可以留空或者添加简单的逻辑
    }
    
    fire(): boolean {
        if (!this.tank) {
            console.warn('武器组件：tank 不存在');
            return false;
        }
        
        if (!this.bulletPool) {
            console.warn('武器组件：bulletPool 不存在');
            return false;
        }
        
        const currentTime = this.tank.scene.time.now;
        if (currentTime - this.lastShotTime < this.fireRate) {
            return false;
        }
        
        // 从对象池获取子弹
        const bullet = this.bulletPool.get();
        if (!bullet) {
            console.warn('武器组件：无法从对象池获取子弹');
            return false;
        }
        
        // 计算子弹位置（炮口偏移）
        const offset = 40;
        const bulletX = this.tank.x + this.direction.x * offset;
        const bulletY = this.tank.y + this.direction.y * offset;
        
        // 发射子弹
        const success = bullet.fire(
            bulletX, 
            bulletY, 
            this.direction, 
            this.bulletSpeed, 
            this.damage,
            this.tank.type
        );
        
        if (success) {
            this.lastShotTime = currentTime;
            console.log('子弹发射成功，当前活跃子弹数:', this.bulletPool.getActiveCount());
            return true;
        } else {
            console.warn('武器组件：子弹发射失败');
            this.bulletPool.release(bullet);
            return false;
        }
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'directionChanged') {
            this.direction = data.direction;
        } else if (message === 'damageBoost') {
            this.damage *= data.factor;
        } else if (message === 'fireRateBoost') {
            this.fireRate /= data.factor;
        }
    }
}