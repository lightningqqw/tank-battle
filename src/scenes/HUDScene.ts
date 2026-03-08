// scenes/HUDScene.ts
import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
    private scoreText!: Phaser.GameObjects.Text;
    private healthBar!: Phaser.GameObjects.Graphics;
    private healthBarBg!: Phaser.GameObjects.Graphics;
    private enemiesText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private healthBarWidth: number = 200;
    private healthBarHeight: number = 20;
    
    private currentHealth: number = 100;
    private maxHealth: number = 100;
    private currentScore: number = 0;
    private enemyCount: number = 0;
    private isActive: boolean = true; // 添加活动标志
    
    constructor() {
        super({ key: 'HUDScene' });
    }
    
    create(): void {
        console.log('HUDScene create 开始');
        
        this.createUIBackground();
        this.createHealthBar();
        this.createTextElements();
        this.setupEventListeners();
        
        // 初始化显示
        this.updateHealthBar();
        this.scoreText.setText('0');
        this.enemiesText.setText('0');
        
        // 监听场景关闭事件
        this.events.once('shutdown', this.cleanup, this);
        
        console.log('HUDScene create 完成');
    }
    
    private createUIBackground(): void {
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, this.cameras.main.width, 80);
        graphics.setDepth(1000);
    }
    
    private createHealthBar(): void {
        // 背景
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(20, 45, this.healthBarWidth, this.healthBarHeight);
        this.healthBarBg.setDepth(1001);
        
        // 前景
        this.healthBar = this.add.graphics();
        this.healthBar.setDepth(1002);
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
        
        // 生命值文字
        this.add.text(20, 45, '生命', style).setDepth(1001);
    }
    
    private setupEventListeners(): void {
        const gameScene = this.scene.get('GameScene');
        
        if (gameScene) {
            // 玩家生命更新
            gameScene.events.on('player_health_updated', (data: { current: number, max: number }) => {
                // ✅ 使用简单的场景存在检查
                if (!this.scene || !this.scene.isActive()) return;
                
                console.log('HUD 收到生命更新:', data);
                this.currentHealth = data.current;
                this.maxHealth = data.max;
                this.updateHealthBar();
            }, this);
            
            // 分数更新
            gameScene.events.on('score_updated', (score: number) => {
                if (!this.scene || !this.scene.isActive()) return;
                console.log('HUD 收到分数更新:', score);
                this.currentScore = score;
                this.scoreText.setText(score.toString());
            }, this);
            
            // 敌人数量更新
            gameScene.events.on('enemy_count_updated', (count: number) => {
                if (!this.scene || !this.scene.isActive()) return;
                console.log('HUD 收到敌人数量更新:', count);
                this.enemyCount = count;
                this.enemiesText.setText(count.toString());
            }, this);
        }
    }
    
    private updateHealthBar(): void {
        // ✅ 检查 healthBar 是否存在且场景活跃
        if (!this.healthBar || !this.scene.isActive() || !this.isActive) return;
        
        try {
            this.healthBar.clear();
            
            const percent = this.currentHealth / this.maxHealth;
            const width = Math.max(0, this.healthBarWidth * percent);
            
            // 根据血量改变颜色
            let color = 0x00ff00; // 绿色
            if (percent < 0.6) color = 0xffff00; // 黄色
            if (percent < 0.3) color = 0xff0000; // 红色
            
            this.healthBar.fillStyle(color, 1);
            this.healthBar.fillRect(20, 45, width, this.healthBarHeight);
        } catch (error) {
            console.warn('更新血条时出错:', error);
        }
    }
    
    // ✅ 清理方法
    private cleanup(): void {
        console.log('HUDScene 清理');
        this.isActive = false;
        
        // 移除所有事件监听
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.off('player_health_updated');
            gameScene.events.off('score_updated');
            gameScene.events.off('enemy_count_updated');
        }
        
        // 清理图形资源
        if (this.healthBar) {
            this.healthBar.clear();
            this.healthBar.destroy();
        }
        
        if (this.healthBarBg) {
            this.healthBarBg.clear();
            this.healthBarBg.destroy();
        }
    }
}