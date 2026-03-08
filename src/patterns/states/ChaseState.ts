// patterns/states/ChaseState.ts
import { TankState } from './TankState';
import { CompositeTank, TankStateType } from '../../entities/CompositeTank';

export class ChaseState extends TankState {
    private chaseSpeed: number;
    private originalSpeed: number;
    
    constructor(tank: CompositeTank) {
        super(tank, 'chase');
        // 获取坦克的基础速度
        const movement = tank.getMovement();
        this.originalSpeed = movement?.getSpeed() || 100;
        this.chaseSpeed = this.originalSpeed * 1.5;
    }
    
    enter(): void {
        super.enter();
        console.log('进入追击状态');
        
        const movement = this.tank.getMovement();
        if (movement) {
            // ✅ 现在 setSpeed 方法存在了
            movement.setSpeed(this.chaseSpeed);
            console.log(`追击速度设置为: ${this.chaseSpeed}`);
        } else {
            console.warn('ChaseState: 找不到 movement 组件');
        }
    }
    
    exit(): void {
        super.exit();
        console.log('退出追击状态');
        
        const movement = this.tank.getMovement();
        if (movement) {
            movement.resetSpeed();
            console.log(`速度重置为: ${this.originalSpeed}`);
        }
    }
    
    update(time: number, delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
        
        const distance = this.distanceToPlayer();
        
        // 如果玩家跑远或丢失视野，回去巡逻
        if (distance > 400 || !this.canSeePlayer()) {
            this.tank.changeState(TankStateType.PATROL);
            return;
        }
        
        // 如果距离够近，攻击
        if (distance < 150) {
            this.tank.changeState(TankStateType.ATTACK);
            return;
        }
        
        // 向玩家移动
        const direction = new Phaser.Math.Vector2(
            player.x - this.tank.x,
            player.y - this.tank.y
        );
        
        const movement = this.tank.getMovement();
        if (movement) {
            movement.setDirection(direction);
        }
    }
}