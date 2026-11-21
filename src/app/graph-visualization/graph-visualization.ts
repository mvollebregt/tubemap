import { Component, computed, input } from '@angular/core';
import { GraphLayout, GraphLayoutLine, GraphLayoutPoint } from '../models/graph-layout';

interface StationMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'tick' | 'interchange';
  ticks: Array<{
    id: string;
    color?: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
  labelX: number;
  labelY: number;
  labelAnchor: 'start' | 'middle' | 'end';
}

@Component({
  selector: 'app-graph-visualization',
  templateUrl: './graph-visualization.html',
  styleUrl: './graph-visualization.css',
})
export class GraphVisualization {
  readonly layout = input.required<GraphLayout>();
  protected readonly stationMarkers = computed(() =>
    this.createStationMarkers(this.layout().points, this.layout().lines),
  );

  private createStationMarkers(
    points: GraphLayoutPoint[],
    lines: GraphLayoutLine[],
  ): StationMarker[] {
    const linesByPoint = new Map<
      string,
      Array<{ line: GraphLayoutLine; isRouteEndpoint: boolean }>
    >();
    for (const line of lines) {
      const fromLines = linesByPoint.get(line.from) ?? [];
      fromLines.push({
        line,
        isRouteEndpoint: line.routeId === undefined || line.isRouteStart,
      });
      linesByPoint.set(line.from, fromLines);
      if (line.to !== line.from) {
        const toLines = linesByPoint.get(line.to) ?? [];
        toLines.push({
          line,
          isRouteEndpoint: line.routeId === undefined || line.isRouteEnd,
        });
        linesByPoint.set(line.to, toLines);
      }
    }

    return points.map((point) => {
      const directions: Array<{ x: number; y: number }> = [];
      const incidentLines = linesByPoint.get(point.id) ?? [];
      for (const { line } of incidentLines) {
        let dx = line.x2 - line.x1;
        let dy = line.y2 - line.y1;
        if (line.from > line.to) {
          dx = -dx;
          dy = -dy;
        }

        const length = Math.hypot(dx, dy);
        if (length === 0) {
          continue;
        }

        dx /= length;
        dy /= length;
        if (dx < 0 || (dx === 0 && dy < 0)) {
          dx = -dx;
          dy = -dy;
        }

        if (!directions.some((direction) => Math.abs(direction.x * dy - direction.y * dx) < 1e-6)) {
          directions.push({ x: dx, y: dy });
        }
      }

      const direction = directions[0] ?? { x: 1, y: 0 };
      const normalX = -direction.y;
      const normalY = direction.x;
      const labelDistance = 17;
      const routesAtPoint = new Map<string, { color?: string; isEndpoint: boolean }>();
      for (const { line, isRouteEndpoint } of incidentLines) {
        if (Math.hypot(line.x2 - line.x1, line.y2 - line.y1) === 0) {
          continue;
        }

        const routeId = line.routeId ?? line.id;
        const route = routesAtPoint.get(routeId);
        if (route) {
          route.isEndpoint ||= isRouteEndpoint;
        } else {
          routesAtPoint.set(routeId, {
            color: line.color,
            isEndpoint: isRouteEndpoint,
          });
        }
      }

      const tickLength = 8;
      const tickStep = 4;
      const ticks: StationMarker['ticks'] =
        directions.length > 1
          ? []
          : [...routesAtPoint.entries()].flatMap(([routeId, route], index) => {
              const offset = index * tickStep;
              const createTick = (side: number, suffix: string) => ({
                id: `${routeId}-${suffix}`,
                color: route.color,
                x1: normalX * side * offset,
                y1: normalY * side * offset,
                x2: normalX * side * (offset + tickLength),
                y2: normalY * side * (offset + tickLength),
              });

              return route.isEndpoint
                ? [createTick(-1, 'left'), createTick(1, 'right')]
                : [createTick(1, 'single')];
            });
      if (ticks.length === 0 && directions.length <= 1) {
        ticks.push({
          id: `${point.id}-tick`,
          x1: 0,
          y1: 0,
          x2: normalX * tickLength,
          y2: normalY * tickLength,
        });
      }

      return {
        id: point.id,
        name: point.name,
        x: point.x,
        y: point.y,
        type: directions.length > 1 ? 'interchange' : 'tick',
        ticks,
        labelX: normalX * labelDistance,
        labelY: normalY * labelDistance + (normalY >= 0 ? 4 : -4),
        labelAnchor: normalX > 0.35 ? 'start' : normalX < -0.35 ? 'end' : 'middle',
      };
    });
  }
}
