import { parseGraphText } from './graph-text';

describe('parseGraphText', () => {
  it('connects consecutive lines and reuses nodes with the same label', () => {
    const graph = parseGraphText('Alpha\nBeta\n\nGamma\nAlpha');

    expect(graph.nodes.map(({ name }) => name)).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(graph.connections.map(({ from, to }) => [from, to])).toEqual([
      ['node-1', 'node-2'],
      ['node-3', 'node-1'],
    ]);
  });

  it('treats labels exactly and blank lines as connection breaks', () => {
    const graph = parseGraphText('Alpha\n Alpha \n\nAlpha');

    expect(graph.nodes.map(({ name }) => name)).toEqual(['Alpha', ' Alpha ']);
    expect(graph.connections).toHaveLength(1);
    expect(graph.connections[0]).toMatchObject({
      from: 'node-1',
      to: 'node-2',
    });
  });

  it('supports empty text and Windows line endings', () => {
    expect(parseGraphText('').nodes).toEqual([]);

    const graph = parseGraphText('Alpha\r\nBeta');
    expect(graph.connections).toHaveLength(1);
  });

  it('uses one London Underground color per blank-line-separated route', () => {
    const graph = parseGraphText('Alpha\nBeta\nGamma\n\nDelta\nEpsilon\n\nZeta\nEta');

    expect(graph.connections.map(({ color }) => color)).toEqual([
      '#B36305',
      '#B36305',
      '#E32017',
      '#FFD300',
    ]);
    expect(
      graph.connections.map(({ routeId, isRouteStart, isRouteEnd }) => [
        routeId,
        isRouteStart,
        isRouteEnd,
      ]),
    ).toEqual([
      ['route-0', true, false],
      ['route-0', false, true],
      ['route-1', true, true],
      ['route-2', true, true],
    ]);
  });
});
