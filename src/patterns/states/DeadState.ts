import { TankState } from './TankState';
import { CompositeTank } from '../../entities/CompositeTank';

export class DeadState extends TankState {
    private deathTime: number = 0;
    
    constructor(tank: CompositeTank) {
        super(tank, 'dead');
    }
    
    enter(): void {
        super.enter();
        
        // 停止移动
        this.tank.setVelocity(0, 0);
        
        // 禁用物理
        if (this.tank.body) {
            (this.tank.body as Phaser.Physics.Arcade.Body).enable = false;
        }
        
        // 播放死亡音效
        this.tank.sendMessage('*', 'audio', 'playSound', { key: 'explosion', volume: 0.7 });
        
        // 播放爆炸效果
        this.tank.sendMessage('*', 'effect', 'explosion', {
            x: this.tank.x,
            y: this.tank.y,
            scale: 1
        });
        
        // 记录死亡时间
        this.deathTime = this.scene.time.now;
    }
    
    update(time: number, delta: number): void {
        // 死亡后2秒销毁
        if (time > this.deathTime + 2000) {
            this.tank.destroy();
        }
    }
}