import { Injectable } from '@angular/core';
import { Graph, GraphConnection } from '../models/graph';
import { GraphLayout, GraphLayoutLine, GraphLayoutPoint } from '../models/graph-layout';

@Injectable({ providedIn: 'root' })
export class DagreGraphLayoutService {
  private readonly minimumWidth = 800;
  private readonly minimumHeight = 500;
  private readonly margin = 72;
  private readonly rankSeparation = 96;
  private readonly nodeSeparation = 48;
  private readonly nodeHeight = 48;

  createLayout(graph: Graph): GraphLayout {
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    if (nodeById.size !== graph.nodes.length) {
      throw new Error("Een graaf mag geen dubbele punt-ID's bevatten.");
    }

    for (const connection of graph.connections) {
      if (!nodeById.has(connection.from) || !nodeById.has(connection.to)) {
        throw new Error(`Verbinding "${connection.id}" verwijst naar een onbekend punt.`);
      }
    }

    if (graph.nodes.length === 0) {
      return new GraphLayout(this.minimumWidth, this.minimumHeight, [], []);
    }

    const outgoing = this.getOutgoingConnections(graph);
    const rankConnections = this.removeFeedbackConnections(graph, outgoing);
    const ranks = this.assignRanks(graph, rankConnections);
    const layers = this.createLayers(graph, ranks);
    const nodeWidths = new Map(
      graph.nodes.map((node) => [node.id, Math.max(72, node.name.length * 8 + 32)]),
    );
    this.reduceCrossings(layers, ranks, rankConnections);

    const layerWidths = layers.map((layer) =>
      Math.max(...layer.map((id) => nodeWidths.get(id) ?? 0)),
    );
    const contentWidth =
      layerWidths.reduce((total, width) => total + width, 0) +
      this.rankSeparation * (layers.length - 1);
    const widestLayerHeight = Math.max(
      ...layers.map((layer) => this.nodeHeight + (layer.length - 1) * this.nodeSeparation),
    );
    const naturalWidth = contentWidth + this.margin * 2;
    const naturalHeight = widestLayerHeight + this.margin * 2;
    const width = Math.max(this.minimumWidth, naturalWidth);
    const height = Math.max(this.minimumHeight, naturalHeight);
    const xOffset = (width - naturalWidth) / 2;
    const yOffset = (height - naturalHeight) / 2;
    const xByRank = new Map<number, number>();
    let left = xOffset + this.margin;

    for (let rank = 0; rank < layers.length; rank += 1) {
      const layerWidth = layerWidths[rank];
      xByRank.set(rank, left + layerWidth / 2);
      left += layerWidth + this.rankSeparation;
    }

    const pointsById = new Map<string, GraphLayoutPoint>();
    for (let rank = 0; rank < layers.length; rank += 1) {
      const layer = layers[rank];
      const layerHeight = this.nodeHeight + (layer.length - 1) * this.nodeSeparation;
      const top = yOffset + this.margin + (widestLayerHeight - layerHeight) / 2;

      layer.forEach((id, index) => {
        const node = nodeById.get(id);
        if (!node) {
          throw new Error(`Punt "${id}" ontbreekt in de graaf.`);
        }

        pointsById.set(
          id,
          new GraphLayoutPoint(
            id,
            node.name,
            xByRank.get(rank) ?? 0,
            top + this.nodeHeight / 2 + index * this.nodeSeparation,
          ),
        );
      });
    }

    const points = graph.nodes.map((node) => {
      const point = pointsById.get(node.id);
      if (!point) {
        throw new Error(`Punt "${node.id}" heeft geen positie gekregen.`);
      }
      return point;
    });
    const lines = graph.connections.map((connection) => {
      const from = pointsById.get(connection.from);
      const to = pointsById.get(connection.to);
      if (!from || !to) {
        throw new Error(`Verbinding "${connection.id}" verwijst naar een onbekend punt.`);
      }

      return new GraphLayoutLine(
        connection.id,
        connection.from,
        connection.to,
        from.x,
        from.y,
        to.x,
        to.y,
      );
    });

    return new GraphLayout(width, height, points, lines);
  }

  private getOutgoingConnections(graph: Graph): Map<string, GraphConnection[]> {
    const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as GraphConnection[]]));
    for (const connection of graph.connections) {
      outgoing.get(connection.from)?.push(connection);
    }
    return outgoing;
  }

  private removeFeedbackConnections(
    graph: Graph,
    outgoing: Map<string, GraphConnection[]>,
  ): GraphConnection[] {
    const visited = new Set<string>();
    const active = new Set<string>();
    const forwardConnections: GraphConnection[] = [];

    for (const node of graph.nodes) {
      if (visited.has(node.id)) {
        continue;
      }

      visited.add(node.id);
      active.add(node.id);
      const stack = [{ id: node.id, nextConnection: 0 }];

      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const connections = outgoing.get(frame.id) ?? [];
        if (frame.nextConnection >= connections.length) {
          stack.pop();
          active.delete(frame.id);
          continue;
        }

        const connection = connections[frame.nextConnection];
        frame.nextConnection += 1;
        if (active.has(connection.to)) {
          continue;
        }

        forwardConnections.push(connection);
        if (!visited.has(connection.to)) {
          visited.add(connection.to);
          active.add(connection.to);
          stack.push({ id: connection.to, nextConnection: 0 });
        }
      }
    }

    return forwardConnections;
  }

  private assignRanks(graph: Graph, connections: GraphConnection[]): Map<string, number> {
    const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
    const outgoing = new Map(graph.nodes.map((node) => [node.id, [] as GraphConnection[]]));
    for (const connection of connections) {
      indegree.set(connection.to, (indegree.get(connection.to) ?? 0) + 1);
      outgoing.get(connection.from)?.push(connection);
    }

    const ranks = new Map(graph.nodes.map((node) => [node.id, 0]));
    const ready = graph.nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
    for (let index = 0; index < ready.length; index += 1) {
      const id = ready[index];
      for (const connection of outgoing.get(id) ?? []) {
        ranks.set(connection.to, Math.max(ranks.get(connection.to) ?? 0, (ranks.get(id) ?? 0) + 1));
        const remainingIndegree = (indegree.get(connection.to) ?? 0) - 1;
        indegree.set(connection.to, remainingIndegree);
        if (remainingIndegree === 0) {
          ready.push(connection.to);
        }
      }
    }

    return ranks;
  }

  private createLayers(graph: Graph, ranks: Map<string, number>): string[][] {
    const maximumRank = Math.max(...graph.nodes.map((node) => ranks.get(node.id) ?? 0));
    const layers = Array.from({ length: maximumRank + 1 }, () => [] as string[]);
    for (const node of graph.nodes) {
      layers[ranks.get(node.id) ?? 0].push(node.id);
    }
    return layers;
  }

  private reduceCrossings(
    layers: string[][],
    ranks: Map<string, number>,
    connections: GraphConnection[],
  ): void {
    const incoming = new Map(layers.flat().map((id) => [id, [] as string[]]));
    const outgoing = new Map(layers.flat().map((id) => [id, [] as string[]]));
    for (const connection of connections) {
      const fromRank = ranks.get(connection.from) ?? 0;
      const toRank = ranks.get(connection.to) ?? 0;
      if (toRank === fromRank + 1) {
        incoming.get(connection.to)?.push(connection.from);
        outgoing.get(connection.from)?.push(connection.to);
      }
    }

    for (let sweep = 0; sweep < 4; sweep += 1) {
      for (let rank = 1; rank < layers.length; rank += 1) {
        this.sortLayer(layers[rank], layers[rank - 1], incoming);
      }
      for (let rank = layers.length - 2; rank >= 0; rank -= 1) {
        this.sortLayer(layers[rank], layers[rank + 1], outgoing);
      }
    }
  }

  private sortLayer(
    layer: string[],
    neighboringLayer: string[],
    neighborsById: Map<string, string[]>,
  ): void {
    const neighborPositions = new Map(neighboringLayer.map((id, index) => [id, index]));
    const originalPositions = new Map(layer.map((id, index) => [id, index]));

    layer.sort((first, second) => {
      const firstBarycenter = this.barycenter(neighborsById.get(first) ?? [], neighborPositions);
      const secondBarycenter = this.barycenter(neighborsById.get(second) ?? [], neighborPositions);
      const firstValue = firstBarycenter ?? originalPositions.get(first) ?? 0;
      const secondValue = secondBarycenter ?? originalPositions.get(second) ?? 0;
      return firstValue - secondValue;
    });
  }

  private barycenter(neighbors: string[], positions: Map<string, number>): number | undefined {
    const neighborPositions = neighbors
      .map((id) => positions.get(id))
      .filter((position): position is number => position !== undefined);
    if (neighborPositions.length === 0) {
      return undefined;
    }

    return (
      neighborPositions.reduce((sum, position) => sum + position, 0) / neighborPositions.length
    );
  }
}
