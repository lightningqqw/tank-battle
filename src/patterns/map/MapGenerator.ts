// patterns/map/MapGenerator.ts
import Phaser from 'phaser';

export interface MapConfig {
    width: number;           // 地图宽度（格子数）
    height: number;          // 地图高度（格子数）
    tileSize: number;        // 格子大小（像素）
    wallDensity: number;     // 墙体密度 (0-1)
    steelRatio: number;      // 钢铁墙比例 (0-1)
    hasWater: boolean;       // 是否有水
    hasGrass: boolean;       // 是否有草丛
    hasBase: boolean;        // 是否有基地
    randomSeed?: number;     // 随机种子
}

export interface MapTile {
    type: string;        // 瓦片类型: 'empty', 'brick', 'steel', 'water', 'grass', 'base'
    x: number;           // 世界坐标X
    y: number;           // 世界坐标Y
    gridX: number;       // 网格坐标X
    gridY: number;       // 网格坐标Y
    health?: number;     // 生命值（用于可破坏墙体）
}

export interface MapData {
    tiles: MapTile[];
    playerSpawn: { x: number, y: number };
    enemySpawns: { x: number, y: number }[];
}

export class MapGenerator {
    private scene: Phaser.Scene;
    private config: MapConfig;
    private random: Phaser.Math.RandomDataGenerator;
    
    constructor(scene: Phaser.Scene, config: MapConfig) {
        this.scene = scene;
        this.config = config;
        
        if (config.randomSeed) {
            this.random = new Phaser.Math.RandomDataGenerator([config.randomSeed.toString()]);
        } else {
            this.random = new Phaser.Math.RandomDataGenerator([Date.now().toString()]);
        }
    }
    
    // ✅ 确保这个静态方法存在且正确导出
    static getRandomConfig(level: number = 1): MapConfig {
        const random = new Phaser.Math.RandomDataGenerator([Date.now().toString()]);
        
        return {
            width: 20,
            height: 15,
            tileSize: 100,
            wallDensity: Math.min(0.2 + level * 0.05, 0.5),
            steelRatio: Math.min(0.1 + level * 0.1, 0.4),
            hasWater: level >= 2,
            hasGrass: level >= 3,
            hasBase: true,
            randomSeed: random.integer()
        };
    }
    
    generateMap(): MapData {
        const { width, height, tileSize } = this.config;
        const grid: string[][] = [];
        const tiles: MapTile[] = [];
        
        // 初始化空白网格
        for (let y = 0; y < height; y++) {
            grid[y] = [];
            for (let x = 0; x < width; x++) {
                grid[y][x] = 'empty';
            }
        }
        
        // 1. 添加边界墙
        this.addBoundaryWalls(grid);
        
        // 2. 添加玩家基地
        if (this.config.hasBase) {
            this.addBase(grid);
        }
        
        // 3. 添加随机障碍物
        this.addRandomObstacles(grid);
        
        // 4. 添加特殊地形
        if (this.config.hasWater) {
            this.addWaterZones(grid);
        }
        
        if (this.config.hasGrass) {
            this.addGrassZones(grid);
        }
        
        // 5. 生成出生点
        const spawns = this.generateSpawnPoints();
        
        // 6. 确保出生点周围是空的
        this.clearSpawnAreas(grid, spawns, tileSize);
        
        // 7. 转换为地图数据
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const type = grid[y][x];
                if (type !== 'empty') {
                    tiles.push(this.createTileData(type, x, y, tileSize));
                }
            }
        }
        
        return {
            tiles,
            playerSpawn: spawns.playerSpawn,
            enemySpawns: spawns.enemySpawns
        };
    }
    
    private createTileData(type: string, gridX: number, gridY: number, tileSize: number): MapTile {
        const tile: MapTile = {
            type,
            x: gridX * tileSize + tileSize / 2, // 中心点对齐
            y: gridY * tileSize + tileSize / 2,
            gridX,
            gridY
        };
        
        // 设置生命值
        switch(type) {
            case 'brick':
                tile.health = 1;
                break;
            case 'steel':
                tile.health = 2;
                break;
            case 'base':
                tile.health = 1;
                break;
            case 'water':
            case 'grass':
                tile.health = Infinity;
                break;
        }
        
        return tile;
    }
    
    private addBoundaryWalls(grid: string[][]): void {
        const { width, height } = this.config;
        
        for (let x = 0; x < width; x++) {
            if (grid[0][x] === 'empty') grid[0][x] = 'steel';
            if (grid[height-1][x] === 'empty') grid[height-1][x] = 'steel';
        }
        
        for (let y = 0; y < height; y++) {
            if (grid[y][0] === 'empty') grid[y][0] = 'steel';
            if (grid[y][width-1] === 'empty') grid[y][width-1] = 'steel';
        }
    }
    
    private addBase(grid: string[][]): void {
        const { width, height } = this.config;
        const baseX = Math.floor(width / 2);
        const baseY = height - 3;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = baseX + dx;
                const ny = baseY + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    if (dx === 0 && dy === 0) {
                        grid[ny][nx] = 'base';
                    } else if (grid[ny][nx] === 'empty') {
                        grid[ny][nx] = 'brick';
                    }
                }
            }
        }
    }
    
    private addRandomObstacles(grid: string[][]): void {
        const { width, height, wallDensity, steelRatio } = this.config;
        
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                if (grid[y][x] !== 'empty') continue;
                
                if (this.random.frac() < wallDensity) {
                    const type = this.random.frac() < steelRatio ? 'steel' : 'brick';
                    grid[y][x] = type;
                }
            }
        }
    }
    
    private addWaterZones(grid: string[][]): void {
        const { width, height } = this.config;
        const waterCount = 3;
        
        for (let i = 0; i < waterCount; i++) {
            const x = this.random.between(3, width - 5);
            const y = this.random.between(3, height - 5);
            
            for (let dy = 0; dy < 2; dy++) {
                for (let dx = 0; dx < 2; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] === 'empty') {
                        grid[ny][nx] = 'water';
                    }
                }
            }
        }
    }
    
    private addGrassZones(grid: string[][]): void {
        const { width, height } = this.config;
        const grassCount = 5;
        
        for (let i = 0; i < grassCount; i++) {
            const x = this.random.between(2, width - 3);
            const y = this.random.between(2, height - 3);
            
            if (grid[y][x] === 'empty') {
                grid[y][x] = 'grass';
            }
        }
    }
    
    private generateSpawnPoints(): { playerSpawn: { x: number, y: number }, enemySpawns: { x: number, y: number }[] } {
        const { width, height, tileSize } = this.config;
        
        const playerSpawn = {
            x: Math.floor(width / 2) * tileSize + tileSize / 2,
            y: (height - 3) * tileSize + tileSize / 2
        };
        
        const enemySpawns = [
            { x: 2 * tileSize + tileSize / 2, y: 2 * tileSize + tileSize / 2 },
            { x: Math.floor(width / 2) * tileSize + tileSize / 2, y: 2 * tileSize + tileSize / 2 },
            { x: (width - 3) * tileSize + tileSize / 2, y: 2 * tileSize + tileSize / 2 }
        ];
        
        return { playerSpawn, enemySpawns };
    }
    
    private clearSpawnAreas(grid: string[][], spawns: { playerSpawn: { x: number, y: number }, enemySpawns: { x: number, y: number }[] }, tileSize: number): void {
        const { width, height } = this.config;
        
        const toGrid = (worldX: number, worldY: number) => ({
            x: Math.floor(worldX / tileSize),
            y: Math.floor(worldY / tileSize)
        });
        
        const playerGrid = toGrid(spawns.playerSpawn.x, spawns.playerSpawn.y);
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = playerGrid.x + dx;
                const ny = playerGrid.y + dy;
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    grid[ny][nx] = 'empty';
                }
            }
        }
        
        spawns.enemySpawns.forEach(spawn => {
            const enemyGrid = toGrid(spawn.x, spawn.y);
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = enemyGrid.x + dx;
                    const ny = enemyGrid.y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        grid[ny][nx] = 'empty';
                    }
                }
            }
        });
    }
}