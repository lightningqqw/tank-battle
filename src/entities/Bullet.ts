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
    private hasHit: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'bullet');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.05);
        this.setDepth(2);

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setCollideWorldBounds(true);
            body.setBounce(0);
            body.setSize(10, 10);
            body.setMass(0.1);
            body.setImmovable(true);
        }

        this.setActive(false);
        this.setVisible(false);
    }


    fire(x: number, y: number, direction: Phaser.Math.Vector2, speed: number, damage: number, shooterType: TankType): boolean {
        console.log('Bullet.fire 被调用');

        if (!this.body) {
            console.error('子弹物理体不存在');
            return false;
        }

        console.log(`参数: 位置(${x},${y}), 方向(${direction.x},${direction.y}), 速度${speed}, 伤害${damage}`);

        this.hasHit = false;
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        this.speed = speed;
        this.damage = damage;
        this.shooterType = shooterType;
        this.direction = direction.clone().normalize();
        this.bornTime = this.scene.time.now;

        const velocityX = this.direction.x * this.speed;
        const velocityY = this.direction.y * this.speed;

        console.log(`设置速度: (${velocityX}, ${velocityY})`);

        this.setVelocity(velocityX, velocityY);
        this.setRotation(Math.atan2(this.direction.y, this.direction.x));

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setEnable(true);
        body.setVelocity(velocityX, velocityY);

        console.log('✅ Bullet.fire 成功');
        return true;
    }

    preUpdate(time: number, delta: number): void {
        super.preUpdate(time, delta);

        if (!this.active || this.hasHit) return;

        if (time > this.bornTime + this.lifespan) {
            this.hit();
            return;
        }

        const { width, height } = this.scene.physics.world.bounds;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            this.hit();
        }
    }

    hit(): void {
        if (this.hasHit) return;
        this.hasHit = true;

        console.log(`子弹击中，伤害值: ${this.damage}`); // 调试

        // 播放爆炸效果
        this.playExplosion();

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
        const scene = this.scene;
        const x = this.x;
        const y = this.y;

        // 简单的爆炸效果
        const circle = scene.add.circle(x, y, 10, 0xff6600);
        scene.tweens.add({
            targets: circle,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => circle.destroy()
        });
    }

    getShooterType(): TankType {
        return this.shooterType;
    }

    getDamage(): number {
        return this.damage;
    }
}