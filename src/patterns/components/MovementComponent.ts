import { Component } from './Component';

export class MovementComponent extends Component {
    private speed: number;
    private targetDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0); // 目标方向
    private currentDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0); // 当前方向
    private baseSpeed: number;
    private isMoving: boolean = false; // 是否有移动输入
    
    constructor(speed: number) {
        super('movement');
        this.baseSpeed = speed;
        this.speed = speed;
    }
    
    update(time: number, delta: number): void {
        if (!this.tank) return;
        
        if (this.isMoving) {
            // 有输入时移动
            this.tank.setVelocity(
                this.currentDirection.x * this.speed,
                this.currentDirection.y * this.speed
            );
            
            // 平滑旋转（可选）
            const targetRotation = Math.atan2(this.currentDirection.y, this.currentDirection.x);
            this.tank.rotation = targetRotation;
        } else {
            // 没有输入时停止
            this.tank.setVelocity(0, 0);
        }
    }
    
    setDirection(direction: Phaser.Math.Vector2): void {
        if (direction.length() > 0) {
            // 有方向输入
            this.targetDirection = direction.clone().normalize();
            this.currentDirection = this.targetDirection.clone();
            this.isMoving = true;
        } else {
            // 没有方向输入
            this.isMoving = false;
        }
    }
    
    // 停止移动
    stop(): void {
        this.isMoving = false;
        if (this.tank) {
            this.tank.setVelocity(0, 0);
        }
    }
    
    setSpeed(speed: number): void {
        this.speed = speed;
    }
    
    resetSpeed(): void {
        this.speed = this.baseSpeed;
    }
    
    getDirection(): Phaser.Math.Vector2 {
        return this.currentDirection.clone();
    }
    
    isCurrentlyMoving(): boolean {
        return this.isMoving;
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'speedBoost') {
            this.speed *= data.factor;
        } else if (message === 'slowDown') {
            this.speed *= data.factor;
        } else if (message === 'stop') {
            this.stop();
        }
    }
}