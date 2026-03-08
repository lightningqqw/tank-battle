export abstract class Component {
    protected tank: any = null;
    protected type: string;
    
    constructor(type: string) {
        this.type = type;
    }
    
    getType(): string {
        return this.type;
    }
    
    onAdd(tank: any): void {
        this.tank = tank;
    }
    
    onRemove(): void {
        this.tank = null;
    }
    
    abstract update(time: number, delta: number): void;
    
    // 组件间通信
    sendMessage(targetType: string, message: string, data?: any): void {
        if (!this.tank) return;
        this.tank.sendMessage(this.type, targetType, message, data);
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        // 子类重写
    }
}