import { Component } from './Component';

export class EffectComponent extends Component {
    private effects: Phaser.GameObjects.GameObject[] = [];
    
    constructor() {
        super('effect');
    }
    
    update(time: number, delta: number): void {
        // 清理已完成的效果
        this.effects = this.effects.filter(effect => effect.active);
    }
    
    createExplosion(x: number, y: number, scale: number = 1): void {
        if (!this.tank || !this.tank.scene) return;
        
        const scene = this.tank.scene;
        
        // 检查是否有爆炸动画
        if (scene.anims.exists('explode')) {
            const explosion = scene.add.sprite(x, y, 'explosion');
            explosion.setScale(scale);
            explosion.play('explode');
            
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            this.effects.push(explosion);
        } else {
            // 没有动画就创建粒子效果
            const particles = scene.add.particles(x, y, 'bullet', {
                speed: { min: -100, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                lifespan: 500,
                quantity: 10,
                blendMode: 'ADD'
            });
            
            scene.time.delayedCall(500, () => {
                particles.destroy();
            });
            
            this.effects.push(particles);
        }
    }
    
    createHitEffect(x: number, y: number): void {
        if (!this.tank || !this.tank.scene) return;
        
        const scene = this.tank.scene;
        
        // 简单命中效果：闪光
        const flash = scene.add.circle(x, y, 10, 0xffaa00, 1);
        
        scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });
        
        this.effects.push(flash);
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'explosion' && data) {
            this.createExplosion(data.x, data.y, data.scale || 1);
        } else if (message === 'hitEffect' && data) {
            this.createHitEffect(data.x, data.y);
        }
    }
}