// patterns/states/PatrolState.ts
import { TankState } from './TankState';
import { CompositeTank, TankStateType } from '../../entities/CompositeTank';

export class PatrolState extends TankState {
    private patrolPoints: { x: number, y: number }[] = [];
    private currentPoint: number = 0;
    private waitTime: number = 0;
    private isWaiting: boolean = false;
    
    constructor(tank: CompositeTank) {
        super(tank, 'patrol');
    }
    
    enter(): void {
        super.enter();
        this.setupPatrolPoints();
        this.waitTime = 0;
        this.isWaiting = false;
        
        // 开始向第一个点移动
        this.moveToNextPoint();
    }
    
    exit(): void {
        super.exit();
        // 停止移动
        const movement = this.tank.getMovement();
        if (movement) {
            movement.stop();
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
    
    private moveToNextPoint(): void {
        const target = this.patrolPoints[this.currentPoint];
        const direction = new Phaser.Math.Vector2(
            target.x - this.tank.x,
            target.y - this.tank.y
        );
        
        if (direction.length() > 0) {
            const movement = this.tank.getMovement();
            if (movement) {
                movement.setDirection(direction);
            }
        }
    }
    
    update(time: number, delta: number): void {
        // 检查是否发现玩家
        if (this.canSeePlayer()) {
            this.tank.changeState(TankStateType.CHASE);
            return;
        }
        
        if (this.isWaiting) {
            // 等待中
            this.waitTime += delta;
            if (this.waitTime > 1000) { // 等待1秒
                this.isWaiting = false;
                this.currentPoint = (this.currentPoint + 1) % this.patrolPoints.length;
                this.moveToNextPoint();
            }
            return;
        }
        
        // 检查是否到达目标点
        const target = this.patrolPoints[this.currentPoint];
        const distance = Phaser.Math.Distance.Between(
            this.tank.x, this.tank.y,
            target.x, target.y
        );
        
        if (distance < 10) {
            // 到达目标点，停止移动并开始等待
            const movement = this.tank.getMovement();
            if (movement) {
                movement.stop();
            }
            this.isWaiting = true;
            this.waitTime = 0;
        }
    }
}