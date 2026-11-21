import { Injectable } from '@angular/core';
import { Graph } from '../models/graph';
import {
  GraphLayout,
  GraphLayoutLine,
  GraphLayoutPoint,
  separateParallelLines,
} from '../models/graph-layout';

@Injectable({ providedIn: 'root' })
export class GraphLayoutService {
  private readonly width = 800;
  private readonly height = 500;
  private readonly margin = 72;

  createLayout(graph: Graph): GraphLayout {
    const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
    if (nodeById.size !== graph.nodes.length) {
      throw new Error("Een graaf mag geen dubbele punt-ID's bevatten.");
    }

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) / 2 - this.margin;
    const points = graph.nodes.map((node, index) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * index) / graph.nodes.length;
      return new GraphLayoutPoint(
        node.id,
        node.name,
        graph.nodes.length === 1 ? centerX : centerX + radius * Math.cos(angle),
        graph.nodes.length === 1 ? centerY : centerY + radius * Math.sin(angle),
      );
    });
    const pointById = new Map(points.map((point) => [point.id, point]));
    const lines = graph.connections.map((connection) => {
      const from = pointById.get(connection.from);
      const to = pointById.get(connection.to);
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

    return new GraphLayout(this.width, this.height, points, separateParallelLines(lines, 3));
  }
}
