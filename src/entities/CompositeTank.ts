import Phaser from 'phaser';
import { TankType, TankColor } from './Tank';
import { Component } from '../patterns/components/Component';
import { MovementComponent } from '../patterns/components/MovementComponent';
import { WeaponComponent } from '../patterns/components/WeaponComponent';
import { ArmorComponent } from '../patterns/components/ArmorComponent';
import { TankState } from '../patterns/states/TankState';

// 状态类型枚举
export enum TankStateType {
    PATROL = 'patrol',
    CHASE = 'chase',
    ATTACK = 'attack',
    FLEE = 'flee',
    DEAD = 'dead'
}

export class CompositeTank extends Phaser.Physics.Arcade.Sprite {
    public type: TankType;
    public color: TankColor;  // 现在在构造函数中初始化
    public baseSpeed: number;
    
    private components: Map<string, Component>;
    private states: Map<TankStateType, TankState>;
    private currentState: TankState | null;
    private messageQueue: { sender: string, target: string, message: string, data?: any }[];
    
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: TankType, color: TankColor = TankColor.BLUE) {
        super(scene, x, y, texture);
        
        // 初始化所有属性
        this.type = type;
        this.color = color;
        this.baseSpeed = 100;
        this.components = new Map();
        this.states = new Map();
        this.currentState = null;
        this.messageQueue = [];
        
        // 添加到场景
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // 设置显示属性
        this.setScale(0.05);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
        
        // 设置物理属性
        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setMass(1);
            body.setDrag(0.1);
            body.setMaxVelocity(300);
            body.setBounce(0);
        }
    }
    
    // ==================== 组件管理 ====================
    
    addComponent(component: Component): this {
        this.components.set(component.getType(), component);
        component.onAdd(this);
        return this;
    }
    
    removeComponent(type: string): this {
        const component = this.components.get(type);
        if (component) {
            component.onRemove();
            this.components.delete(type);
        }
        return this;
    }
    
    // 泛型方法获取组件
    getComponent<T extends Component>(type: string): T | null {
        return (this.components.get(type) as T) || null;
    }
    
    // 类型安全的辅助方法
    getMovement(): MovementComponent | null {
        return this.getComponent<MovementComponent>('movement');
    }
    
    getWeapon(): WeaponComponent | null {
        return this.getComponent<WeaponComponent>('weapon');
    }
    
    getArmor(): ArmorComponent | null {
        return this.getComponent<ArmorComponent>('armor');
    }
    
    // ==================== 状态管理 ====================
    
    registerState(type: TankStateType, state: TankState): this {
        this.states.set(type, state);
        return this;
    }
    
    changeState(stateType: TankStateType): boolean {
        const newState = this.states.get(stateType);
        if (!newState) {
            console.warn(`状态 ${stateType} 不存在`);
            return false;
        }
        
        if (this.currentState === newState) {
            return false;
        }
        
        if (this.currentState) {
            this.currentState.exit();
        }
        
        this.currentState = newState;
        this.currentState.enter();
        
        return true;
    }
    
    getCurrentState(): TankState | null {
        return this.currentState;
    }
    
    getCurrentStateType(): TankStateType | null {
        for (const [type, state] of this.states.entries()) {
            if (state === this.currentState) {
                return type;
            }
        }
        return null;
    }
    
    // ==================== 组件间通信 ====================
    
    sendMessage(sender: string, target: string, message: string, data?: any): this {
        if (target === '*') {
            this.components.forEach(component => {
                if (component.getType() !== sender) {
                    component.handleMessage(sender, message, data);
                }
            });
        } else {
            const targetComponent = this.components.get(target);
            if (targetComponent) {
                targetComponent.handleMessage(sender, message, data);
            } else {
                this.messageQueue.push({ sender, target, message, data });
            }
        }
        return this;
    }
    
    private processMessageQueue(): void {
        const remaining: typeof this.messageQueue = [];
        
        this.messageQueue.forEach(msg => {
            const targetComponent = this.components.get(msg.target);
            if (targetComponent) {
                targetComponent.handleMessage(msg.sender, msg.message, msg.data);
            } else {
                remaining.push(msg);
            }
        });
        
        this.messageQueue = remaining;
    }
    
    // ==================== 核心方法 ====================
    
    update(time: number, delta: number): void {
        this.processMessageQueue();
        
        this.components.forEach(component => {
            component.update(time, delta);
        });
        
        if (this.currentState) {
            this.currentState.update(time, delta);
        }
    }
    
    takeDamage(amount: number): this {
        const armor = this.getArmor();
        if (armor) {
            armor.handleMessage('external', 'takeDamage', { amount });
        }
        
        // 受伤视觉反馈
        this.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.clearTint();
        });
        
        return this;
    }
    
    fire(): boolean {
        const weapon = this.getWeapon();
        if (weapon) {
            return weapon.fire();
        }
        return false;
    }
    
    // 移动到指定方向 - 改名避免与父类冲突
    moveToDirection(direction: Phaser.Math.Vector2): this {
        const movement = this.getMovement();
        if (movement) {
            movement.setDirection(direction);
        }
        return this;
    }
    
    // 停止移动 - 改为符合父类签名
    stop(): this {
        this.setVelocity(0, 0);
        return this;
    }
    
    // 获取速度
    getSpeed(): number {
        const movement = this.getMovement();
        return movement ? (movement as any).speed || this.baseSpeed : this.baseSpeed;
    }
    
    // 设置速度
    setSpeed(speed: number): this {
        const movement = this.getMovement();
        if (movement) {
            (movement as any).setSpeed?.(speed);
        }
        return this;
    }
    
    destroy(): this {
        // 清理组件
        this.components.forEach(component => component.onRemove());
        this.components.clear();
        
        // 清理状态
        this.states.clear();
        this.currentState = null;
        
        // 发送销毁事件
        this.sendMessage('*', '*', 'destroyed', {});
        
        super.destroy();
        return this;
    }
}