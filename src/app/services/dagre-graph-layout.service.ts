import { Injectable } from '@angular/core';
import { Graph, GraphConnection } from '../models/graph';
import {
  GraphLayout,
  GraphLayoutLine,
  GraphLayoutPoint,
  separateParallelLines,
} from '../models/graph-layout';

@Injectable({ providedIn: 'root' })
export class DagreGraphLayoutService {
  private readonly minimumWidth = 800;
  private readonly minimumHeight = 500;
  private readonly margin = 72;
  private readonly rankSeparation = 96;
  private readonly nodeSeparation = 48;
  private readonly nodeHeight = 48;
  private readonly maximumStraighteningAdjustment = this.nodeSeparation / 2;
  private readonly minimumStraightenedNodeGap = this.nodeHeight / 2;

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

    this.straightenRoutes(graph, ranks, pointsById);

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
        connection.color,
        connection.routeId,
        connection.isRouteStart,
        connection.isRouteEnd,
      );
    });

    return new GraphLayout(width, height, points, separateParallelLines(lines, 3));
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

  private straightenRoutes(
    graph: Graph,
    ranks: Map<string, number>,
    pointsById: Map<string, GraphLayoutPoint>,
  ): void {
    const connectionsByRoute = new Map<string, GraphConnection[]>();
    const routesByNode = new Map<string, Set<string>>();

    for (const connection of graph.connections) {
      const membership = connection.routeId
        ? `route:${connection.routeId}`
        : `connection:${connection.id}`;
      for (const nodeId of [connection.from, connection.to]) {
        const routes = routesByNode.get(nodeId) ?? new Set<string>();
        routes.add(membership);
        routesByNode.set(nodeId, routes);
      }

      if (connection.routeId) {
        const routeConnections = connectionsByRoute.get(connection.routeId) ?? [];
        routeConnections.push(connection);
        connectionsByRoute.set(connection.routeId, routeConnections);
      }
    }

    const routeEntries = [...connectionsByRoute.entries()]
      .map(([routeId, connections]) => {
        const nodeIds = new Set(connections.flatMap(({ from, to }) => [from, to]));
        const adjustableNodeCount = [...nodeIds].filter((id) => {
          const routes = routesByNode.get(id);
          return routes?.size === 1 && routes.has(`route:${routeId}`);
        }).length;
        return { routeId, connections, adjustableNodeCount };
      })
      .sort((first, second) => second.adjustableNodeCount - first.adjustableNodeCount);

    for (const { routeId, connections } of routeEntries) {
      const firstConnection =
        connections.find((connection) => connection.isRouteStart) ?? connections[0];
      const routeNodeIds = [firstConnection.from, firstConnection.to];
      const usedConnections = new Set([firstConnection]);

      while (usedConnections.size < connections.length) {
        const nextConnection = connections.find(
          (connection) =>
            !usedConnections.has(connection) &&
            connection.from === routeNodeIds[routeNodeIds.length - 1],
        );
        if (!nextConnection) {
          break;
        }

        usedConnections.add(nextConnection);
        routeNodeIds.push(nextConnection.to);
      }

      if (
        usedConnections.size !== connections.length ||
        routeNodeIds.length < 3 ||
        new Set(routeNodeIds).size !== routeNodeIds.length ||
        new Set(routeNodeIds.map((id) => ranks.get(id))).size !== routeNodeIds.length
      ) {
        continue;
      }

      const routePoints = routeNodeIds.map((id) => pointsById.get(id));
      if (routePoints.some((point) => point === undefined)) {
        continue;
      }

      const adjustableNodeIds = routeNodeIds.filter((id) => {
        const routes = routesByNode.get(id);
        return routes?.size === 1 && routes.has(`route:${routeId}`);
      });
      if (adjustableNodeIds.length === 0) {
        continue;
      }

      const anchorYs = routeNodeIds
        .filter((id) => !adjustableNodeIds.includes(id))
        .map((id) => pointsById.get(id)?.y ?? 0);
      if (anchorYs.some((y) => y !== anchorYs[0])) {
        continue;
      }

      const yPositions = adjustableNodeIds.map((id) => pointsById.get(id)?.y ?? 0);
      const minimumY = Math.min(...yPositions);
      const maximumY = Math.max(...yPositions);
      const alignedY = anchorYs.length > 0 ? anchorYs[0] : (minimumY + maximumY) / 2;
      if (yPositions.some((y) => Math.abs(y - alignedY) > this.maximumStraighteningAdjustment)) {
        continue;
      }

      const routeNodeSet = new Set(routeNodeIds);
      const wouldCrowdAnotherPoint = adjustableNodeIds.some((id) => {
        const rank = ranks.get(id);
        return graph.nodes.some((node) => {
          if (routeNodeSet.has(node.id) || ranks.get(node.id) !== rank) {
            return false;
          }

          const point = pointsById.get(node.id);
          return (
            point !== undefined && Math.abs(point.y - alignedY) < this.minimumStraightenedNodeGap
          );
        });
      });
      if (wouldCrowdAnotherPoint) {
        continue;
      }

      for (const id of adjustableNodeIds) {
        const point = pointsById.get(id);
        if (point) {
          pointsById.set(id, new GraphLayoutPoint(point.id, point.name, point.x, alignedY));
        }
      }
    }
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
