// patterns/components/MovementComponent.ts
import { Component } from './Component';

export class MovementComponent extends Component {
    private speed: number;
    private targetDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
    private currentDirection: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 1); // 默认向下（方便测试）
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
            
            // 设置坦克旋转
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
            
            console.log(`Movement: 方向设置为 (${this.currentDirection.x}, ${this.currentDirection.y})`);
            
            // 重要：广播方向变化给其他组件（特别是武器组件）
            this.sendMessage('weapon', 'directionChanged', { 
                direction: this.currentDirection.clone() 
            });
        } else {
            this.isMoving = false;
        }
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
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'speedBoost') {
            this.speed *= data.factor;
        }
    }
}