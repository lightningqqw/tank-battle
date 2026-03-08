import { TankState } from './TankState';
import { CompositeTank } from '../../entities/CompositeTank';

export class AttackState extends TankState {
    private attackTimer: number = 0;
    private strafeDirection: number = 1;
    
    constructor(tank: CompositeTank) {
        super(tank, 'attack');
    }
    
    update(time: number, delta: number): void {
        const player = this.findPlayer();
        if (!player) return;
        
        const distance = this.distanceToPlayer();
        
        // 如果玩家跑远，继续追击
        if (distance > 250) {
            this.tank.changeState('chase');
            return;
        }
        
        // 攻击
        this.attackTimer += delta;
        if (this.attackTimer > 1000) { // 每秒攻击一次
            const weapon = this.tank.getComponent('weapon');
            if (weapon) {
                weapon.fire();
            }
            this.attackTimer = 0;
        }
        
        // 左右移动躲避子弹
        this.strafe(delta);
        
        // 炮塔对准玩家
        const direction = new Phaser.Math.Vector2(
            player.x - this.tank.x,
            player.y - this.tank.y
        );
        
        const movement = this.tank.getComponent('movement');
        if (movement) {
            movement.setDirection(direction);
        }
    }
    
    private strafe(delta: number): void {
        // 每2秒换方向
        if (Math.random() < 0.01) {
            this.strafeDirection *= -1;
        }
        
        // 垂直方向不变，水平方向左右移动
        const movement = this.tank.getComponent('movement');
        if (movement) {
            const dir = movement.getDirection();
            dir.x = this.strafeDirection;
            dir.normalize();
            movement.setDirection(dir);
        }
    }
}