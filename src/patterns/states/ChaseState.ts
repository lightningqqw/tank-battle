import { TankState } from './TankState';
import { CompositeTank } from '../../entities/CompositeTank';

export class ChaseState extends TankState {
    private chaseSpeed: number;
    
    constructor(tank: CompositeTank) {
        super(tank, 'chase');
        this.chaseSpeed = (tank as any).baseSpeed * 1.5;
    }
    
    enter(): void {
        super.enter();
        // 加速
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.setSpeed(this.chaseSpeed);
        }
    }
    
    exit(): void {
        super.exit();
        // 恢复速度
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.resetSpeed();
        }
    }
    
    update(time: number, delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
        
        const distance = this.distanceToPlayer();
        
        // 如果玩家跑远或丢失视野，回去巡逻
        if (distance > 400 || !this.canSeePlayer()) {
            this.tank.changeState('patrol');
            return;
        }
        
        // 如果距离够近，攻击
        if (distance < 150) {
            this.tank.changeState('attack');
            return;
        }
        
        // 向玩家移动
        const direction = new Phaser.Math.Vector2(
            player.x - this.tank.x,
            player.y - this.tank.y
        );
        
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.setDirection(direction);
        }
    }
}