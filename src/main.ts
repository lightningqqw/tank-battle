import { GameManager } from './game/GameManager';
import './styles/main.css';

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    const gameManager = GameManager.getInstance();
    gameManager.start();
});

// 添加全局错误处理
window.addEventListener('error', (e) => {
    console.error('游戏运行时错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});