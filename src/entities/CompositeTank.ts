// entities/CompositeTank.ts
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
    public color: TankColor;
    public baseSpeed: number;
    public isDestroying: boolean = false;
    
    private components: Map<string, Component>;
    private states: Map<TankStateType, TankState>;
    private currentState: TankState | null;
    private messageQueue: { sender: string, target: string, message: string, data?: any }[];
    
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: TankType, color: TankColor = TankColor.BLUE) {
        super(scene, x, y, texture);
        
        this.type = type;
        this.color = color;
        this.baseSpeed = 100;
        this.components = new Map();
        this.states = new Map();
        this.currentState = null;
        this.messageQueue = [];
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.05);
        this.setCollideWorldBounds(true);
        this.setDepth(1);
        
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
    
    getComponent<T extends Component>(type: string): T | null {
        return (this.components.get(type) as T) || null;
    }
    
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
        if (this.isDestroying) return;
        
        this.processMessageQueue();
        
        this.components.forEach(component => {
            component.update(time, delta);
        });
        
        if (this.currentState) {
            this.currentState.update(time, delta);
        }
    }
    
    takeDamage(amount: number): void {
        if (this.isDestroying) return;
        
        console.log(`坦克受伤，伤害值: ${amount}`);
        
        const armor = this.getArmor();
        if (armor) {
            const survived = armor.takeDamage(amount);
            
            // ✅ 使用 try-catch 包装视觉反馈
            try {
                if (this.scene && this.scene.time) {
                    this.setTint(0xff0000);
                    this.scene.time.delayedCall(200, () => {
                        if (this.active && !this.isDestroying) {
                            this.clearTint();
                        }
                    });
                }
            } catch (error) {
                // 忽略视觉反馈的错误
            }
            
            if (!survived) {
                console.log('坦克死亡，准备销毁');
                this.destroy();
            }
        } else {
            console.warn('坦克没有装甲组件！');
        }
    }
    
    fire(): boolean {
        const weapon = this.getWeapon();
        if (weapon) {
            return weapon.fire();
        }
        return false;
    }
    
    moveToDirection(direction: Phaser.Math.Vector2): this {
        const movement = this.getMovement();
        if (movement) {
            movement.setDirection(direction);
        }
        return this;
    }
    
    stop(): this {
        this.setVelocity(0, 0);
        return this;
    }
    
    // ✅ 修复 destroy 方法 - 移除 isActive 检查
    destroy(): this {
        if (this.isDestroying) return this;
        this.isDestroying = true;
        
        console.log(`CompositeTank.destroy 被调用: ${this.type}`);
        
        this.setVelocity(0, 0);
        this.setActive(false);
        this.setVisible(false);
        
        // ✅ 安全地发送事件 - 使用简单的检查
        if (this.scene && this.scene.events) {
            try {
                // 直接发送事件，不检查 isActive
                this.scene.events.emit('tank_destroyed', {
                    tank: this,
                    type: this.type,
                    x: this.x,
                    y: this.y
                });
            } catch (error) {
                // 忽略事件发送的错误
                console.warn('发送销毁事件时出错:', error);
            }
        }
        
        // 清理组件
        this.components.forEach(component => component.onRemove());
        this.components.clear();
        this.states.clear();
        this.currentState = null;
        
        // 调用父类 destroy
        super.destroy();
        return this;
    }
}