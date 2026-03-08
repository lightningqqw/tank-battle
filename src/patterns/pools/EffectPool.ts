// patterns/pools/EffectPool.ts
export class EffectPool {
    private scene: Phaser.Scene;
    private explosions: Phaser.GameObjects.Sprite[] = [];
    private hitEffects: Phaser.GameObjects.Sprite[] = [];
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.preCreateExplosions(5);
        this.preCreateHitEffects(5);
    }
    
    private preCreateExplosions(count: number): void {
        for (let i = 0; i < count; i++) {
            const exp = this.scene.add.sprite(-100, -100, 'explosion');
            exp.setVisible(false);
            exp.setActive(false);
            this.explosions.push(exp);
        }
    }
    
    private preCreateHitEffects(count: number): void {
        for (let i = 0; i < count; i++) {
            const effect = this.scene.add.sprite(-100, -100, 'explosion');
            effect.setVisible(false);
            effect.setActive(false);
            effect.setScale(0.5);
            this.hitEffects.push(effect);
        }
    }
    
    getExplosion(x: number, y: number): void {
        const explosion = this.explosions.find(e => !e.active);
        
        if (explosion) {
            explosion.setPosition(x, y);
            explosion.setVisible(true);
            explosion.setActive(true);
            
            if (this.scene.anims.exists('explode')) {
                explosion.play('explode');
                explosion.once('animationcomplete', () => {
                    explosion.setVisible(false);
                    explosion.setActive(false);
                });
            } else {
                this.scene.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 2,
                    duration: 500,
                    onComplete: () => {
                        explosion.setVisible(false);
                        explosion.setActive(false);
                        explosion.setAlpha(1);
                        explosion.setScale(1);
                    }
                });
            }
        } else {
            const temp = this.scene.add.sprite(x, y, 'explosion');
            temp.setScale(0.5);
            this.scene.tweens.add({
                targets: temp,
                alpha: 0,
                scale: 2,
                duration: 500,
                onComplete: () => temp.destroy()
            });
        }
    }
    
    getHitEffect(x: number, y: number): void {
        const effect = this.hitEffects.find(e => !e.active);
        
        if (effect) {
            effect.setPosition(x, y);
            effect.setVisible(true);
            effect.setActive(true);
            effect.setScale(0.3);
            
            this.scene.tweens.add({
                targets: effect,
                alpha: 0,
                scale: 1,
                duration: 300,
                onComplete: () => {
                    effect.setVisible(false);
                    effect.setActive(false);
                    effect.setAlpha(1);
                    effect.setScale(0.3);
                }
            });
        } else {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffaa00, 1);
            graphics.fillCircle(x, y, 8);
            
            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => graphics.destroy()
            });
        }
    }
    
    getWallHitEffect(x: number, y: number): void {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xaaaaaa, 0.8);
        graphics.fillCircle(x, y, 5);
        
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            onComplete: () => graphics.destroy()
        });
    }
}