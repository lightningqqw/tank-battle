// patterns/components/MovementComponent.ts
import { Component } from './Component';

export class MovementComponent extends Component {
    private speed: number;
    private targetDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private currentDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 1);
    private baseSpeed: number;
    private isMoving: boolean = false;
    
    constructor(speed: number) {
        super('movement');
        this.baseSpeed = speed;
        this.speed = speed;
    }
    
    update(time: number, delta: number): void {
        if (!this.tank) return;
        
        if (this.isMoving) {
            this.tank.setVelocity(
                this.currentDirection.x * this.speed,
                this.currentDirection.y * this.speed
            );
            
            const targetRotation = Math.atan2(this.currentDirection.y, this.currentDirection.x);
            this.tank.rotation = targetRotation;
        } else {
            this.tank.setVelocity(0, 0);
        }
    }
    
    setDirection(direction: Phaser.Math.Vector2): void {
        if (direction.length() > 0) {
            this.targetDirection = direction.clone().normalize();
            this.currentDirection = this.targetDirection.clone();
            this.isMoving = true;
            
            // 广播方向变化给武器组件
            this.sendMessage('weapon', 'directionChanged', { 
                direction: this.currentDirection.clone() 
            });
        } else {
            this.isMoving = false;
        }
    }
    
    // ✅ 添加 setSpeed 方法
    setSpeed(speed: number): void {
        console.log(`Movement: 设置速度 ${this.speed} -> ${speed}`);
        this.speed = speed;
    }
    
    // ✅ 添加 resetSpeed 方法
    resetSpeed(): void {
        this.speed = this.baseSpeed;
        console.log(`Movement: 重置速度到 ${this.speed}`);
    }
    
    stop(): void {
        this.isMoving = false;
        if (this.tank) {
            this.tank.setVelocity(0, 0);
        }
    }
    
    getDirection(): Phaser.Math.Vector2 {
        return this.currentDirection.clone();
    }
    
    getSpeed(): number {
        return this.speed;
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