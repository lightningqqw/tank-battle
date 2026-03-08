// patterns/pools/BulletPool.ts
import { Bullet } from '../../entities/Bullet';

export class BulletPool {
    private scene: Phaser.Scene;
    private pool: Bullet[] = [];
    private active: Set<Bullet> = new Set();
    private poolSize: number;
    
    constructor(scene: Phaser.Scene, poolSize: number = 30) {
        this.scene = scene;
        this.poolSize = poolSize;
        
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
    
    get(): Bullet | null {
        let bullet = this.pool.find(b => !b.active);
        
        if (!bullet) {
            if (this.pool.length < this.poolSize * 1.5) {
                bullet = new Bullet(this.scene, -100, -100);
                bullet.setActive(false);
                bullet.setVisible(false);
                this.pool.push(bullet);
                console.log('子弹池扩容，当前大小:', this.pool.length);
            } else {
                console.warn('子弹池已满，无法创建新子弹');
                return null;
            }
        }
        
        if (bullet) {
            this.active.add(bullet);
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
        }
    }
    
    getActiveBullets(): Bullet[] {
        return Array.from(this.active).filter(bullet => bullet.active);
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