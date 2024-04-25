export interface IBar {
    Time: number;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    TickVolume: number;
}

export interface IData {
    ChunkStart: number;
    Bars: IBar[];
}