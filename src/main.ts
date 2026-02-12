import { GameManager } from './game/GameManager'
import './styles/main.css'

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
  const gameManager = new GameManager()
  gameManager.start()
})