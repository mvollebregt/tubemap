import { Component, computed, input } from '@angular/core';
import { GraphLayout, GraphLayoutLine, GraphLayoutPoint } from '../models/graph-layout';

interface StationMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'tick' | 'interchange';
  tickX: number;
  tickY: number;
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
    const linesByPoint = new Map<string, GraphLayoutLine[]>();
    for (const line of lines) {
      linesByPoint.set(line.from, [...(linesByPoint.get(line.from) ?? []), line]);
      if (line.to !== line.from) {
        linesByPoint.set(line.to, [...(linesByPoint.get(line.to) ?? []), line]);
      }
    }

    return points.map((point) => {
      const directions: Array<{ x: number; y: number }> = [];
      for (const line of linesByPoint.get(point.id) ?? []) {
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

      return {
        id: point.id,
        name: point.name,
        x: point.x,
        y: point.y,
        type: directions.length > 1 ? 'interchange' : 'tick',
        tickX: normalX * 8,
        tickY: normalY * 8,
        labelX: normalX * labelDistance,
        labelY: normalY * labelDistance + (normalY >= 0 ? 4 : -4),
        labelAnchor: normalX > 0.35 ? 'start' : normalX < -0.35 ? 'end' : 'middle',
      };
    });
  }
}
