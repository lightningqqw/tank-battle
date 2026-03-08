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


    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, type: TankType, color: TankColor) {
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

        // 设置初始方向（向下）
        setTimeout(() => {
            const movement = this.getMovement();
            if (movement) {
                movement.setDirection(new Phaser.Math.Vector2(0, 1));
            }
        }, 100);
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

    takeDamage(amount: number): void {
        console.log(`坦克受伤，伤害值: ${amount}`); // 调试

        const armor = this.getArmor();
        if (armor) {
            // 直接调用 armor 的方法，而不是通过消息
            const survived = armor.takeDamage(amount);

            // 受伤视觉反馈
            this.setTint(0xff0000);
            this.scene.time.delayedCall(200, () => {
                this.clearTint();
            });

            if (!survived) {
                console.log('坦克死亡');
                this.destroy();
            }
        } else {
            console.warn('坦克没有装甲组件！');
        }
    }

    // entities/CompositeTank.ts
    fire(): boolean {
        console.log('CompositeTank.fire 被调用');

        const weapon = this.getWeapon();
        if (!weapon) {
            console.warn('找不到武器组件');
            return false;
        }

        console.log('找到武器组件，调用 weapon.fire()');
        const result = weapon.fire();
        console.log('weapon.fire() 返回:', result);
        return result;
    }

    // 确保 getWeapon 方法正确
    getWeapon(): WeaponComponent | null {
        return this.getComponent<WeaponComponent>('weapon');
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