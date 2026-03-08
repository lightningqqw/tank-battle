import Phaser from 'phaser';

export interface GameOverData {
    win: boolean;
    score: number;
    level: number;
    enemiesKilled?: number;
    time?: number;
}

export class GameOverScene extends Phaser.Scene {
    private resultText!: Phaser.GameObjects.Text;
    private stats: GameOverData = {
        win: false,
        score: 0,
        level: 1,
        enemiesKilled: 0,
        time: 0
    };
    
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    init(data: GameOverData): void {
        this.stats = { ...this.stats, ...data };
    }
    
    create(): void {
        const { width, height } = this.cameras.main;
        
        // 半透明背景
        this.add.rectangle(0, 0, width, height, 0x000000, 0.8)
            .setOrigin(0)
            .setDepth(1);
        
        // 游戏结果
        this.createResultText();
        
        // 统计信息
        this.createStats();
        
        // 按钮
        this.createButtons();
        
        // 添加键盘监听
        this.input.keyboard?.once('keydown-ENTER', () => this.restartGame());
        this.input.keyboard?.once('keydown-ESC', () => this.returnToMenu());
    }
    
    private createResultText(): void {
        const { width, height } = this.cameras.main;
        
        const message = this.stats.win ? 'VICTORY!' : 'GAME OVER';
        const color = this.stats.win ? '#00ff00' : '#ff0000';
        
        this.resultText = this.add.text(width / 2, height / 2 - 150, message, {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: color,
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        })
        .setOrigin(0.5)
        .setDepth(2);
        
        // 添加动画
        this.tweens.add({
            targets: this.resultText,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    private createStats(): void {
        const { width, height } = this.cameras.main;
        
        const stats = [
            `得分: ${this.stats.score}`,
            `关卡: ${this.stats.level}`,
            `击毁敌人数: ${this.stats.enemiesKilled}`,
            `用时: ${this.formatTime(this.stats.time || 0)}`
        ];
        
        const style: Phaser.Types.GameObjects.Text.TextStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'left'
        };
        
        stats.forEach((stat, index) => {
            this.add.text(width / 2 - 100, height / 2 - 50 + index * 40, stat, style)
                .setDepth(2);
        });
    }
    
    private createButtons(): void {
        const { width, height } = this.cameras.main;
        
        // 重新开始按钮
        const restartBtn = this.add.text(width / 2 - 120, height / 2 + 100, '重新开始', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setInteractive({ useHandCursor: true });
        
        // 主菜单按钮
        const menuBtn = this.add.text(width / 2 + 120, height / 2 + 100, '主菜单', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#2196F3',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setDepth(2)
        .setInteractive({ useHandCursor: true });
        
        // 按钮事件
        restartBtn.on('pointerdown', () => this.restartGame());
        restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#45a049' }));
        restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#4CAF50' }));
        
        menuBtn.on('pointerdown', () => this.returnToMenu());
        menuBtn.on('pointerover', () => menuBtn.setStyle({ backgroundColor: '#0b7dda' }));
        menuBtn.on('pointerout', () => menuBtn.setStyle({ backgroundColor: '#2196F3' }));
        
        // 添加提示文本
        this.add.text(width / 2, height - 50, '按 Enter 重新开始 | ESC 返回主菜单', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#aaaaaa'
        })
        .setOrigin(0.5)
        .setDepth(2);
    }
    
    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    private restartGame(): void {
        // 停止所有场景
        this.scene.stop('HUDScene');
        this.scene.stop('GameScene');
        this.scene.stop('GameOverScene');
        
        // 重新开始
        this.scene.start('BootScene');
    }
    
    private returnToMenu(): void {
        // 这里可以添加主菜单场景
        // 暂时先重启游戏
        this.restartGame();
    }
}