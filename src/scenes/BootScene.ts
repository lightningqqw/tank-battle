import Phaser from 'phaser';

// 坦克图片
import tankBlue from '@assets/images/tanks/tank_blue.png';
import tankRed from '@assets/images/tanks/tank_red.png';
import tankGreen from '@assets/images/tanks/tank_green.png';
import bullet from '@assets/images/bullet.png';

// 地图瓦片
import brick from '@assets/images/tiles/brick.png';
import grass from '@assets/images/tiles/grass.png';
import steel from '@assets/images/tiles/steel.png';
import water from '@assets/images/tiles/water.png';

// 特效
import explosion from '@assets/images/explosion.png';

// 音效
import shot from '@assets/audio/shot.mp3';
import explosion1 from '@assets/audio/explosion1.mp3';
import powerup from '@assets/audio/powerup.mp3';
import hit from '@assets/audio/hit.mp3';
import move from '@assets/audio/move.mp3';

export class BootScene extends Phaser.Scene {
    private loadingText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Graphics;
    private progressBox!: Phaser.GameObjects.Graphics;
    
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload(): void {
        // 创建加载界面
        this.createLoadingUI();
        
        // 设置加载事件监听
        this.setupLoadEvents();
        
        // 加载所有游戏资源
        this.loadAssets();
    }
    
    private createLoadingUI(): void {
        const { width, height } = this.cameras.main;
        
        // 背景
        this.add.rectangle(0, 0, width, height, 0x000000)
            .setOrigin(0);
        
        // 游戏标题
        this.add.text(width / 2, height / 2 - 100, '坦克大战', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
        })
        .setOrigin(0.5)
        .setDepth(1);
        
        // 加载进度条背景
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x333333, 0.8);
        this.progressBox.fillRect(width / 4, height / 2, width / 2, 30);
        this.progressBox.setDepth(1);
        
        // 加载进度条
        this.progressBar = this.add.graphics();
        this.progressBar.setDepth(2);
        
        // 加载文本
        this.loadingText = this.add.text(width / 2, height / 2 + 50, '加载中...', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setDepth(1);
        
        // 版本信息
        this.add.text(width - 10, height - 20, 'v1.0.0', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#666666'
        })
        .setOrigin(1, 0)
        .setDepth(1);
    }
    
    private setupLoadEvents(): void {
        // 加载进度事件
        this.load.on('progress', (value: number) => {
            this.updateProgressBar(value);
        });
        
        // 加载完成事件
        this.load.on('complete', () => {
            this.loadingText.setText('加载完成！');
            
            // 延迟一点进入游戏，让玩家看到100%
            this.time.delayedCall(500, () => {
                this.scene.start('GameScene');
                this.scene.launch('HUDScene');
            });
        });
        
        // 加载错误事件
        this.load.on('loaderror', (file: any) => {
            console.error('加载失败:', file.key, file.src);
            this.loadingText.setText(`加载失败: ${file.key}`);
        });
    }
    
    private updateProgressBar(value: number): void {
        const { width } = this.cameras.main;
        
        this.progressBar.clear();
        this.progressBar.fillStyle(0x4CAF50, 1);
        this.progressBar.fillRect(
            width / 4 + 5, 
            this.cameras.main.height / 2 + 5, 
            (width / 2 - 10) * value, 
            20
        );
        
        // 更新百分比文本
        const percent = Math.floor(value * 100);
        this.loadingText.setText(`加载中... ${percent}%`);
    }
    
    private loadAssets(): void {
        console.log('开始加载游戏资源...');
        
        // ===== 坦克图片 =====
        this.load.image('tank_blue', tankBlue);
        this.load.image('tank_red', tankRed);
        this.load.image('tank_green', tankGreen);
        
        // ===== 子弹 =====
        this.load.image('bullet', bullet);
        
        // ===== 地图瓦片 =====
        this.load.image('brick', brick);
        this.load.image('steel', steel);
        this.load.image('water', water);
        this.load.image('grass', grass);
        
        // ===== 特效 =====
        // 爆炸动画精灵表
        this.load.spritesheet('explosion', explosion, {
            frameWidth: 64,
            frameHeight: 64,
            endFrame: 7
        });
        
        // ===== 音效 =====
        this.load.audio('shot', shot);
        this.load.audio('explosion', explosion1);
        this.load.audio('powerup', powerup);
        this.load.audio('hit', hit);
        this.load.audio('move', move);
        
        console.log('资源加载队列已提交');
    }
    
    create(): void {
        console.log('BootScene create');
        
        // 创建爆炸动画
        this.createExplosionAnimation();
        
        // 这里不立即启动游戏场景，等待preload完成
        // 实际在load.complete事件中启动
    }
    
    private createExplosionAnimation(): void {
        // 检查纹理是否存在
        if (!this.textures.exists('explosion')) {
            console.warn('爆炸纹理不存在，跳过动画创建');
            return;
        }
        
        // 创建爆炸动画
        if (!this.anims.exists('explode')) {
            try {
                this.anims.create({
                    key: 'explode',
                    frames: this.anims.generateFrameNumbers('explosion', { 
                        start: 0, 
                        end: 7 
                    }),
                    frameRate: 15,
                    repeat: 0,
                    hideOnComplete: true
                });
                console.log('爆炸动画创建成功');
            } catch (error) {
                console.error('创建爆炸动画失败:', error);
            }
        }
    }
}