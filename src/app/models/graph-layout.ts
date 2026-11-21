export class GraphLayoutPoint {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly x: number,
    public readonly y: number,
  ) {}
}

export class GraphLayoutLine {
  constructor(
    public readonly id: string,
    public readonly from: string,
    public readonly to: string,
    public readonly x1: number,
    public readonly y1: number,
    public readonly x2: number,
    public readonly y2: number,
  ) {}
}

export class GraphLayout {
  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly points: GraphLayoutPoint[],
    public readonly lines: GraphLayoutLine[],
  ) {}
}
