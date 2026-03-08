import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private enemiesText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private healthBarWidth: number = 200;
    private healthBarHeight: number = 20;
    
    private currentHealth: number = 100;
    private maxHealth: number = 100;
    private currentScore: number = 0;
    private currentLevel: number = 1;
    private enemyCount: number = 0;
    
    constructor() {
        super({ key: 'HUDScene' });
    }
    
    create(): void {
        this.createUIBackground();
        this.createHealthBar();
        this.createTextElements();
        this.setupEventListeners();
    }
    
    private createUIBackground(): void {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, this.cameras.main.width, 80);
        graphics.setDepth(1000);
    }
    
    private createHealthBar(): void {
        // 背景
        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRect(20, 45, this.healthBarWidth, this.healthBarHeight);
        bg.setDepth(1001);
        
        // 前景
        this.healthBar = this.add.graphics();
        this.healthBar.setDepth(1002);
        this.updateHealthBar();
    }
    
    private createTextElements(): void {
        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        // 分数
        this.add.text(20, 10, '分数', style).setDepth(1001);
        this.scoreText = this.add.text(20, 30, '0', style).setDepth(1001);
        
        // 敌人数量
        this.add.text(240, 10, '剩余敌人', style).setDepth(1001);
        this.enemiesText = this.add.text(240, 30, '0', style).setDepth(1001);
        
        // 关卡
        this.add.text(400, 10, '关卡', style).setDepth(1001);
        this.levelText = this.add.text(400, 30, '1', style).setDepth(1001);
    }
    
    private setupEventListeners(): void {
        // 监听游戏事件
        const gameScene = this.scene.get('GameScene');
        
        gameScene.events.on('score_updated', (score: number) => {
            this.currentScore = score;
            this.scoreText.setText(score.toString());
        });
        
        gameScene.events.on('player_health_updated', (data: { current: number, max: number }) => {
            this.currentHealth = data.current;
            this.maxHealth = data.max;
            this.updateHealthBar();
        });
        
        gameScene.events.on('enemy_count_updated', (count: number) => {
            this.enemyCount = count;
            this.enemiesText.setText(count.toString());
        });
        
        gameScene.events.on('level_updated', (level: number) => {
            this.currentLevel = level;
            this.levelText.setText(level.toString());
        });
    }
    
    private updateHealthBar(): void {
        this.healthBar.clear();
        
        const percent = this.currentHealth / this.maxHealth;
        const width = this.healthBarWidth * percent;
        
        // 根据血量改变颜色
        let color = 0x00ff00; // 绿色
        if (percent < 0.6) color = 0xffff00; // 黄色
        if (percent < 0.3) color = 0xff0000; // 红色
        
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(20, 45, width, this.healthBarHeight);
    }
    
    update(): void {
        // 可以添加一些动画效果
    }
}