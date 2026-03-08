// patterns/components/ArmorComponent.ts
import { Component } from './Component';

export class ArmorComponent extends Component {
    private maxHealth: number;
    private currentHealth: number;
    private isDead: boolean = false;
    
    constructor(health: number) {
        super('armor');
        this.maxHealth = health;
        this.currentHealth = health;
        console.log(`装甲组件创建，生命值: ${this.currentHealth}/${this.maxHealth}`);
    }
    
    update(time: number, delta: number): void {
        // 可以添加自动恢复等逻辑
    }
    
    takeDamage(amount: number): boolean {
        if (this.isDead) return false;
        
        const oldHealth = this.currentHealth;
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        console.log(`装甲受伤: ${oldHealth} -> ${this.currentHealth}/${this.maxHealth}`);
        
        // 发送受伤事件
        if (this.tank && this.tank.scene) {
            this.tank.scene.events.emit('player_health_updated', {
                current: this.currentHealth,
                max: this.maxHealth
            });
            
            this.sendMessage('*', 'damaged', {
                health: this.currentHealth,
                maxHealth: this.maxHealth,
                damage: amount
            });
        }
        
        if (this.currentHealth <= 0) {
            console.log('装甲耐久耗尽');
            this.isDead = true;
            this.sendMessage('*', 'destroyed', {});
            return false;
        }
        
        return true;
    }
    
    heal(amount: number): void {
        if (this.isDead) return;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        console.log(`装甲修复: ${this.currentHealth}/${this.maxHealth}`);
    }
    
    getHealthPercent(): number {
        return this.currentHealth / this.maxHealth;
    }
    
    getCurrentHealth(): number {
        return this.currentHealth;
    }
    
    // ✅ 添加 getMaxHealth 方法
    getMaxHealth(): number {
        return this.maxHealth;
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'heal') {
            this.heal(data.amount);
        } else if (message === 'takeDamage') {
            this.takeDamage(data.amount);
        }
    }
}