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
    public readonly color?: string,
    public readonly routeId?: string,
    public readonly isRouteStart = false,
    public readonly isRouteEnd = false,
  ) {}
}

export class Graph {
  constructor(
    public readonly nodes: GraphNode[],
    public readonly connections: GraphConnection[],
  ) {}
}
