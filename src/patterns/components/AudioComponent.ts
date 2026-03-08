import { Component } from './Component';

export class AudioComponent extends Component {
    private sounds: Map<string, Phaser.Sound.BaseSound> = new Map();
    
    constructor() {
        super('audio');
    }
    
    onAdd(tank: any): void {
        super.onAdd(tank);
        
        // 预加载音效
        this.loadSounds();
    }
    
    private loadSounds(): void {
        if (!this.tank || !this.tank.scene) return;
        
        const scene = this.tank.scene;
        const soundKeys = ['shot', 'explosion', 'powerup', 'flee', 'hit'];
        
        soundKeys.forEach(key => {
            if (scene.sound.get(key)) {
                this.sounds.set(key, scene.sound.get(key));
            }
        });
    }
    
    update(time: number, delta: number): void {
        // 音频组件不需要每帧更新
    }
    
    playSound(key: string, config?: { volume?: number, rate?: number }): void {
        const sound = this.sounds.get(key);
        if (sound) {
            sound.play({
                volume: config?.volume || 1,
                rate: config?.rate || 1
            });
        }
    }
    
    handleMessage(sender: string, message: string, data?: any): void {
        if (message === 'playSound' && data?.key) {
            this.playSound(data.key, data);
        }
    }
}