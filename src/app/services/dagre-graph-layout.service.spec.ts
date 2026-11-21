import { TestBed } from '@angular/core/testing';
import { Graph, GraphConnection, GraphNode } from '../models/graph';
import { DagreGraphLayoutService } from './dagre-graph-layout.service';

describe('DagreGraphLayoutService', () => {
  let service: DagreGraphLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DagreGraphLayoutService);
  });

  it('places connected points in hierarchical ranks and matches line endpoints', () => {
    const graph = new Graph(
      [new GraphNode('a', 'Alpha'), new GraphNode('b', 'Beta'), new GraphNode('c', 'Gamma')],
      [new GraphConnection('ab', 'a', 'b'), new GraphConnection('bc', 'b', 'c')],
    );

    const layout = service.createLayout(graph);
    const points = new Map(layout.points.map((point) => [point.id, point]));

    expect(points.get('a')?.x).toBeLessThan(points.get('b')?.x ?? 0);
    expect(points.get('b')?.x).toBeLessThan(points.get('c')?.x ?? 0);
    expect(layout.lines[0]).toMatchObject({
      x1: points.get('a')?.x,
      y1: points.get('a')?.y,
      x2: points.get('b')?.x,
      y2: points.get('b')?.y,
    });
  });

  it('lays out cyclic graphs while retaining every connection', () => {
    const graph = new Graph(
      [new GraphNode('a', 'Alpha'), new GraphNode('b', 'Beta')],
      [new GraphConnection('ab', 'a', 'b'), new GraphConnection('ba', 'b', 'a')],
    );

    const layout = service.createLayout(graph);

    expect(layout.points).toHaveLength(2);
    expect(layout.lines.map(({ id }) => id)).toEqual(['ab', 'ba']);
    expect(layout.points[0].x).not.toBe(layout.points[1].x);
  });

  it('orders adjacent layers to reduce edge crossings', () => {
    const graph = new Graph(
      [
        new GraphNode('a', 'Alpha'),
        new GraphNode('b', 'Beta'),
        new GraphNode('x', 'X-ray'),
        new GraphNode('y', 'Yankee'),
      ],
      [new GraphConnection('ay', 'a', 'y'), new GraphConnection('bx', 'b', 'x')],
    );

    const layout = service.createLayout(graph);
    const points = new Map(layout.points.map((point) => [point.id, point]));

    expect(points.get('y')?.y).toBeLessThan(points.get('x')?.y ?? 0);
  });

  it('returns an empty layout for an empty graph', () => {
    const layout = service.createLayout(new Graph([], []));

    expect(layout.points).toEqual([]);
    expect(layout.lines).toEqual([]);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('rejects connections that reference missing points', () => {
    const graph = new Graph([new GraphNode('a', 'Alpha')], [new GraphConnection('ab', 'a', 'b')]);

    expect(() => service.createLayout(graph)).toThrowError(
      'Verbinding "ab" verwijst naar een onbekend punt.',
    );
  });
});
