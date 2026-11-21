import { TestBed } from '@angular/core/testing';
import { Graph, GraphConnection, GraphNode } from '../models/graph';
import { GraphLayoutService } from './graph-layout.service';

describe('GraphLayoutService', () => {
  let service: GraphLayoutService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphLayoutService);
  });

  it('creates named points and lines with coordinates matching their endpoints', () => {
    const graph = new Graph(
      [new GraphNode('a', 'Alpha'), new GraphNode('b', 'Beta')],
      [new GraphConnection('ab', 'a', 'b')],
    );

    const layout = service.createLayout(graph);

    expect(layout.points.map(({ name }) => name)).toEqual(['Alpha', 'Beta']);
    expect(layout.lines[0]).toMatchObject({
      from: 'a',
      to: 'b',
      x1: layout.points[0].x,
      y1: layout.points[0].y,
      x2: layout.points[1].x,
      y2: layout.points[1].y,
    });
  });

  it('places a single point in the center and supports an empty graph', () => {
    const singlePoint = service.createLayout(
      new Graph([new GraphNode('a', 'Alpha')], []),
    );
    const empty = service.createLayout(new Graph([], []));

    expect(singlePoint.points[0].x).toBe(singlePoint.width / 2);
    expect(singlePoint.points[0].y).toBe(singlePoint.height / 2);
    expect(empty.points).toEqual([]);
    expect(empty.lines).toEqual([]);
  });

  it('rejects connections that reference missing points', () => {
    const graph = new Graph(
      [new GraphNode('a', 'Alpha')],
      [new GraphConnection('ab', 'a', 'b')],
    );

    expect(() => service.createLayout(graph)).toThrowError(
      'Verbinding "ab" verwijst naar een onbekend punt.',
    );
  });
});
