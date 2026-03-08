import { CompositeTank } from '../../entities/CompositeTank';

export abstract class TankState {
    protected tank: CompositeTank;
    protected scene: Phaser.Scene;
    protected name: string;
    
    constructor(tank: CompositeTank, name: string) {
        this.tank = tank;
        this.scene = tank.scene;
        this.name = name;
    }
    
    getName(): string {
        return this.name;
    }
    
    enter(): void {
        console.log(`坦克进入 ${this.name} 状态`);
    }
    
    exit(): void {
        console.log(`坦克退出 ${this.name} 状态`);
    }
    
    abstract update(time: number, delta: number): void;
    
    protected findPlayer(): any {
        return (this.scene as any).playerTank;
    }
    
    protected distanceToPlayer(): number {
        const player = this.findPlayer();
        if (!player) return Infinity;
        
        return Phaser.Math.Distance.Between(
            this.tank.x, this.tank.y,
            player.x, player.y
        );
    }
    
    protected canSeePlayer(): boolean {
        const player = this.findPlayer();
        if (!player) return false;
        
        const distance = this.distanceToPlayer();
        return distance < 300; // 视野范围
    }
}