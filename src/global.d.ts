declare module '*.png' {
    const value: string; // 根据你的使用场景，可能是 string 或 any
    export default value;
  }

  declare module '*.mp3' {
    const src: string;
    export default src;
  }
  
  // 如果有其他资源类型，可以一起声明
  declare module '*.wav' {
    const src: string;
    export default src;
  }
  
  declare module '*.ogg' {
    const src: string;
    export default src;
  }