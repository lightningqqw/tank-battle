// patterns/pools/BulletPool.ts
import { Bullet } from '../../entities/Bullet';

export class BulletPool {
    private scene: Phaser.Scene;
    private pool: Bullet[] = [];
    private active: Set<Bullet> = new Set();
    private activeBulletsArray: Bullet[] = []; // 新增：维护一个数组用于碰撞检测
    private poolSize: number;

    constructor(scene: Phaser.Scene, poolSize: number = 30) {
        this.scene = scene;
        this.poolSize = poolSize;

        // 预创建子弹
        for (let i = 0; i < poolSize; i++) {
            const bullet = new Bullet(scene, -100, -100);
            bullet.setActive(false);
            bullet.setVisible(false);
            if (bullet.body) {
                (bullet.body as Phaser.Physics.Arcade.Body).setEnable(false);
            }
            this.pool.push(bullet);
        }

        console.log(`子弹池初始化完成，预创建 ${poolSize} 颗子弹`);
    }

    // patterns/pools/BulletPool.ts
    get(): Bullet | null {
        console.log('BulletPool.get 被调用，当前池大小:', this.pool.length);

        // 查找空闲子弹
        let bullet = this.pool.find(b => !b.active);

        if (bullet) {
            console.log('找到空闲子弹');
        } else {
            console.log('没有空闲子弹，尝试扩容');

            if (this.pool.length < this.poolSize * 1.5) {
                bullet = new Bullet(this.scene, -100, -100);
                bullet.setActive(false);
                bullet.setVisible(false);
                this.pool.push(bullet);
                console.log('子弹池扩容，新大小:', this.pool.length);
            } else {
                console.warn('子弹池已满，无法创建新子弹');
                return null;
            }
        }

        if (bullet) {
            this.active.add(bullet);
            this.activeBulletsArray.push(bullet);
            console.log(`子弹池: 获取子弹成功，当前活跃数: ${this.active.size}`);
        }

        return bullet;
    }

    release(bullet: Bullet): void {
        if (this.active.has(bullet)) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.setPosition(-100, -100);
            if (bullet.body) {
                const body = bullet.body as Phaser.Physics.Arcade.Body;
                body.setEnable(false);
                body.setVelocity(0, 0);
            }
            this.active.delete(bullet);

            // 从数组中移除
            const index = this.activeBulletsArray.indexOf(bullet);
            if (index > -1) {
                this.activeBulletsArray.splice(index, 1);
            }

            console.log(`子弹池: 释放子弹，当前活跃数: ${this.active.size}`);
        }
    }

    // ✅ 返回同一个数组引用，Phaser会持续使用这个数组
    getActiveBullets(): Bullet[] {
        return this.activeBulletsArray;
    }

    getActiveCount(): number {
        return this.active.size;
    }

    getPoolSize(): number {
        return this.pool.length;
    }

    clear(): void {
        this.active.forEach(bullet => this.release(bullet));
    }
}