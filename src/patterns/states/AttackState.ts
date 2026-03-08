// patterns/states/AttackState.ts
import { TankState } from './TankState';
import { CompositeTank, TankStateType } from '../../entities/CompositeTank';

export class AttackState extends TankState {
    private attackTimer: number = 0;
    private strafeDirection: number = 1;
    private originalSpeed: number;
    
    constructor(tank: CompositeTank) {
        super(tank, 'attack');
        const movement = tank.getMovement();
        this.originalSpeed = movement?.getSpeed() || 100;
    }
    
    enter(): void {
        super.enter();
        console.log('进入攻击状态');
        
        // 攻击时可以稍微减慢速度，便于瞄准
        const movement = this.tank.getMovement();
        if (movement) {
            movement.setSpeed(this.originalSpeed * 0.8);
        }
    }
    
    exit(): void {
        super.exit();
        
        const movement = this.tank.getMovement();
        if (movement) {
            movement.resetSpeed();
        }
    }
    
    update(time: number, delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
        
        const distance = this.distanceToPlayer();
        
        if (distance > 250) {
            this.tank.changeState(TankStateType.CHASE);
            return;
        }
        
        this.attackTimer += delta;
        if (this.attackTimer > 1000) {
            const weapon = this.tank.getWeapon();
            if (weapon) {
                weapon.fire();
            }
            this.attackTimer = 0;
        }
        
        // 左右移动躲避
        this.strafe(delta);
        
        // 炮塔对准玩家
        const direction = new Phaser.Math.Vector2(
            player.x - this.tank.x,
            player.y - this.tank.y
        );
        
        const movement = this.tank.getMovement();
        if (movement) {
            movement.setDirection(direction);
        }
    }
    
    private strafe(delta: number): void {
        if (Math.random() < 0.01) {
            this.strafeDirection *= -1;
        }
        
        const movement = this.tank.getMovement();
        if (movement) {
            const dir = movement.getDirection();
            dir.x = this.strafeDirection;
            dir.normalize();
            movement.setDirection(dir);
        }
    }
}