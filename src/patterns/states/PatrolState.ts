// patterns/states/PatrolState.ts
import { TankState } from './TankState';
import { CompositeTank, TankStateType } from '../../entities/CompositeTank';

export class PatrolState extends TankState {
    private patrolPoints: { x: number, y: number }[] = [];
    private currentPoint: number = 0;
    private waitTime: number = 0;
    
    constructor(tank: CompositeTank) {
        super(tank, 'patrol');
    }
    
    enter(): void {
        super.enter();
        this.setupPatrolPoints();
        this.waitTime = 0;
        
        // 确保使用正常速度
        const movement = this.tank.getMovement();
        if (movement) {
            movement.resetSpeed();
        }
    }
    
    private setupPatrolPoints(): void {
        const { x, y } = this.tank;
        const range = 150;
        
        this.patrolPoints = [
            { x: x - range, y: y - range },
            { x: x + range, y: y - range },
            { x: x + range, y: y + range },
            { x: x - range, y: y + range }
        ];
    }
    
    update(time: number, delta: number): void {
        if (this.canSeePlayer()) {
            this.tank.changeState(TankStateType.CHASE);
            return;
        }
        
        const target = this.patrolPoints[this.currentPoint];
        const distance = Phaser.Math.Distance.Between(
            this.tank.x, this.tank.y,
            target.x, target.y
        );
        
        if (distance < 10) {
            this.waitTime += delta;
            if (this.waitTime > 1000) {
                this.currentPoint = (this.currentPoint + 1) % this.patrolPoints.length;
                this.waitTime = 0;
                
                const nextTarget = this.patrolPoints[this.currentPoint];
                const direction = new Phaser.Math.Vector2(
                    nextTarget.x - this.tank.x,
                    nextTarget.y - this.tank.y
                );
                
                const movement = this.tank.getMovement();
                if (movement) {
                    movement.setDirection(direction);
                }
            } else {
                const movement = this.tank.getMovement();
                if (movement) {
                    movement.stop();
                }
            }
        }
    }
}