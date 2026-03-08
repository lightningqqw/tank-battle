import { Component } from './Component';

export class ArmorComponent extends Component {
    private maxHealth: number;
    private currentHealth: number;
    
    constructor(health: number) {
        super('armor');
        this.maxHealth = health;
        this.currentHealth = health;
    }
    
    update(time: number, delta: number): void {
        // 自动恢复等逻辑
    }
    
    takeDamage(amount: number): boolean {
        this.currentHealth -= amount;
        
        // 广播受伤事件
        this.sendMessage('*', 'damaged', {
            health: this.currentHealth,
            maxHealth: this.maxHealth,
            damage: amount
        });
        
        if (this.currentHealth <= 0) {
            this.sendMessage('*', 'destroyed', {});
            return false;
        }
        
        return true;
    }
    
    heal(amount: number): void {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
    
    getHealthPercent(): number {
        return this.currentHealth / this.maxHealth;
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'heal') {
            this.heal(data.amount);
        }
    }
}