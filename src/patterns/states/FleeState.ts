import { TankState } from './TankState';
import { CompositeTank } from '../../entities/CompositeTank';

export class FleeState extends TankState {
    private fleeSpeed: number;
    private fleeDirection: Phaser.Math.Vector2 | null = null;
    private fleeTimer: number = 0;
    
    constructor(tank: CompositeTank) {
        super(tank, 'flee');
        this.fleeSpeed = (tank as any).baseSpeed * 2;
    }
    
    enter(): void {
        super.enter();
        
        // 加速逃跑
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.setSpeed(this.fleeSpeed);
        }
        
        // 计算逃跑方向（远离玩家）
        this.calculateFleeDirection();
        
        // 逃跑时可能发出求救信号
        this.tank.sendMessage('*', 'audio', 'playSound', { key: 'flee', volume: 0.5 });
    }
    
    exit(): void {
        super.exit();
        
        // 恢复速度
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.resetSpeed();
        }
    }
    
    private calculateFleeDirection(): void {
        const player = this.findPlayer();
        if (!player) return;
        
        // 方向是从玩家指向坦克（远离玩家）
        this.fleeDirection = new Phaser.Math.Vector2(
            this.tank.x - player.x,
            this.tank.y - player.y
        ).normalize();
    }
    
    update(time: number, delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
        
        this.fleeTimer += delta;
        
        // 每2秒重新计算逃跑方向
        if (this.fleeTimer > 2000) {
            this.calculateFleeDirection();
            this.fleeTimer = 0;
        }
        
        const distance = this.distanceToPlayer();
        
        // 如果已经跑得够远，回去巡逻
        if (distance > 400) {
            this.tank.changeState('patrol');
            return;
        }
        
        // 如果血量恢复或玩家远离，可能反击
        const armor = this.tank.getComponent('armor');
        if (armor) {
            const healthPercent = (armor as any).getHealthPercent();
            if (healthPercent > 0.5 && distance < 200) {
                this.tank.changeState('attack');
                return;
            }
        }
        
        // 向逃跑方向移动
        if (this.fleeDirection) {
            const movement = this.tank.getComponent('movement');
            if (movement) {
                movement.setDirection(this.fleeDirection);
            }
        }
        
        // 逃跑时随机开火骚扰
        if (Math.random() < 0.01) {
            const weapon = this.tank.getComponent('weapon');
            if (weapon) {
                (weapon as any).fire();
            }
        }
    }
}
