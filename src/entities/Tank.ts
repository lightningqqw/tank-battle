export enum TankType {
    PLAYER = 'PLAYER',
    ENEMY = 'ENEMY'
}

export enum TankColor {
    BLUE = 'blue',
    RED = 'red',
    GREEN = 'green'
}

export interface ITank {
    type: TankType;
    color: TankColor;
    takeDamage(amount: number): void;
    fire(): boolean;
    update(time: number, delta: number): void;
}