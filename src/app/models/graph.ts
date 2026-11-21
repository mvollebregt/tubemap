export class GraphNode {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class GraphConnection {
  constructor(
    public readonly id: string,
    public readonly from: string,
    public readonly to: string,
  ) {}
}

export class Graph {
  constructor(
    public readonly nodes: GraphNode[],
    public readonly connections: GraphConnection[],
  ) {}
}
