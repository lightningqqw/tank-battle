// patterns/components/WeaponComponent.ts
import { Component } from './Component';

export class WeaponComponent extends Component {
    private damage: number;
    private fireRate: number;
    private lastShotTime: number = 0;
    private bulletSpeed: number;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -1);
    private bulletPool: any; // BulletPool 类型
    
    constructor(damage: number, fireRate: number, bulletSpeed: number) {
        super('weapon');
        this.damage = damage;
        this.fireRate = fireRate;
        this.bulletSpeed = bulletSpeed;
    }
    
    setBulletPool(pool: any): void {
        this.bulletPool = pool;
    }
    
    update(time: number, delta: number): void {
        // 武器冷却更新（如果需要）
    }
    
    fire(): boolean {
        if (!this.tank || !this.bulletPool) {
            console.warn('武器组件未正确初始化');
            return false;
        }
        
        const currentTime = this.tank.scene.time.now;
        if (currentTime - this.lastShotTime < this.fireRate) {
            return false; // 冷却中
        }
        
        // 从对象池获取子弹
        const bullet = this.bulletPool.get();
        if (!bullet) {
            console.warn('无法获取子弹');
            return false;
        }
        
        // 计算子弹位置（炮口偏移）
        const offset = 40; // 炮口长度
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
            
            // 添加到活跃集合（如果 bulletPool 有记录活跃子弹的功能）
            if (this.bulletPool.active) {
                this.bulletPool.active.add(bullet);
            }
            
            // 播放音效
            this.sendMessage('audio', 'playSound', { key: 'shot', volume: 0.3 });
            
            return true;
        } else {
            // 发射失败，归还子弹
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