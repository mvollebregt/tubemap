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
});
