// entities/Bullet.ts
import Phaser from 'phaser';
import { TankType } from './Tank';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 300;
    private damage: number = 10;
    private shooterType: TankType = TankType.ENEMY;
    private direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, -1);
    private lifespan: number = 2000;
    private bornTime: number = 0;
    private hasHit: boolean = false; // 防止多次触发
    
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'bullet');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.05);
        this.setDepth(2);
        
        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false); // 禁用重力，防止下落
            body.setCollideWorldBounds(true);
            body.setBounce(0); // 无反弹
            body.setSize(10, 10);
            body.setMass(0.1); // 质量小，不会被撞偏
            body.setImmovable(true); // 不可移动，不会被墙推开
        }
        
        this.setActive(false);
        this.setVisible(false);
    }
    
    fire(x: number, y: number, direction: Phaser.Math.Vector2, speed: number, damage: number, shooterType: TankType): boolean {
        if (!this.body) {
            console.error('子弹物理体不存在');
            return false;
        }
        
        // 重置状态
        this.hasHit = false;
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);
        
        this.speed = speed;
        this.damage = damage;
        this.shooterType = shooterType;
        this.direction = direction.clone().normalize();
        this.bornTime = this.scene.time.now;
        
        // 计算速度
        const velocityX = this.direction.x * this.speed;
        const velocityY = this.direction.y * this.speed;
        
        // 设置速度 - 直线飞行
        this.setVelocity(velocityX, velocityY);
        
        // 设置旋转
        this.setRotation(Math.atan2(this.direction.y, this.direction.x));
        
        // 确保物理属性正确
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setEnable(true);
        body.setVelocity(velocityX, velocityY);
        body.setImmovable(true); // 重申不可移动
        body.setMass(0.1);
        body.setBounce(0);
        
        return true;
    }
    
    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);
        
        if (!this.active || this.hasHit) return;
        
        // 生命周期检查
        if (time > this.bornTime + this.lifespan) {
            this.hit();
            return;
        }
        
        // 边界检查
        const { width, height } = this.scene.physics.world.bounds;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            this.hit();
        }
        
        // 确保速度不变（防止被物理引擎改变）
        const currentVel = this.body?.velocity;
        if (currentVel) {
            const expectedVelX = this.direction.x * this.speed;
            const expectedVelY = this.direction.y * this.speed;
            
            // 如果速度变了，强制修正（可选，调试用）
            if (Math.abs(currentVel.x - expectedVelX) > 10 || 
                Math.abs(currentVel.y - expectedVelY) > 10) {
                this.setVelocity(expectedVelX, expectedVelY);
            }
        }
    }
    
    hit(): void {
        if (this.hasHit) return; // 防止多次触发
        this.hasHit = true;
        
        // 播放爆炸效果
        this.playExplosion();
        
        // 播放音效
        if (this.scene.sound.get('explosion')) {
            this.scene.sound.play('explosion', { volume: 0.3 });
        }
        
        // 禁用子弹
        this.setActive(false);
        this.setVisible(false);
        
        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setEnable(false);
            body.setVelocity(0, 0);
        }
        
        this.setPosition(-100, -100);
    }
    
    private playExplosion(): void {
        // 创建爆炸效果
        if (this.scene.textures.exists('explosion')) {
            const explosion = this.scene.add.sprite(this.x, this.y, 'explosion');
            explosion.setScale(0.5);
            
            if (this.scene.anims.exists('explode')) {
                explosion.play('explode');
                explosion.once('animationcomplete', () => explosion.destroy());
            } else {
                // 没有动画就淡出
                this.scene.tweens.add({
                    targets: explosion,
                    alpha: 0,
                    scale: 1,
                    duration: 300,
                    onComplete: () => explosion.destroy()
                });
            }
        } else {
            // 没有爆炸纹理，用圆形代替
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xff6600, 1);
            graphics.fillCircle(this.x, this.y, 10);
            
            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => graphics.destroy()
            });
        }
    }
    
    getShooterType(): TankType {
        return this.shooterType;
    }
    
    getDamage(): number {
        return this.damage;
    }
}