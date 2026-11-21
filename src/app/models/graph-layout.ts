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
    public readonly color?: string,
    public readonly routeId?: string,
    public readonly isRouteStart = false,
    public readonly isRouteEnd = false,
  ) {}
}

export function separateParallelLines(
  lines: GraphLayoutLine[],
  spacing: number,
): GraphLayoutLine[] {
  const lineIndexesByPair = new Map<string, number[]>();

  lines.forEach((line, index) => {
    const pair = [line.from, line.to].sort();
    const key = JSON.stringify(pair);
    const indexes = lineIndexesByPair.get(key) ?? [];
    indexes.push(index);
    lineIndexesByPair.set(key, indexes);
  });

  const separatedLines = [...lines];
  for (const indexes of lineIndexesByPair.values()) {
    if (indexes.length < 2) {
      continue;
    }

    const firstLine = lines[indexes[0]];
    const startsAtFirstId = firstLine.from <= firstLine.to;
    const startX = startsAtFirstId ? firstLine.x1 : firstLine.x2;
    const startY = startsAtFirstId ? firstLine.y1 : firstLine.y2;
    const endX = startsAtFirstId ? firstLine.x2 : firstLine.x1;
    const endY = startsAtFirstId ? firstLine.y2 : firstLine.y1;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      continue;
    }

    const normalX = -dy / length;
    const normalY = dx / length;
    indexes.forEach((lineIndex, index) => {
      const line = lines[lineIndex];
      const offset = (index - (indexes.length - 1) / 2) * spacing;
      separatedLines[lineIndex] = new GraphLayoutLine(
        line.id,
        line.from,
        line.to,
        line.x1 + normalX * offset,
        line.y1 + normalY * offset,
        line.x2 + normalX * offset,
        line.y2 + normalY * offset,
        line.color,
        line.routeId,
        line.isRouteStart,
        line.isRouteEnd,
      );
    });
  }

  return separatedLines;
}

export class GraphLayout {
  constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly points: GraphLayoutPoint[],
    public readonly lines: GraphLayoutLine[],
  ) {}
}
