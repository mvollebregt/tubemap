import { Graph, GraphConnection, GraphNode } from './graph';

const londonUndergroundColors = [
  '#B36305',
  '#E32017',
  '#FFD300',
  '#00782A',
  '#F3A9BB',
  '#A0A5A9',
  '#9B0056',
  '#000000',
  '#003688',
  '#0098D4',
  '#95CDBA',
];

export function parseGraphText(text: string): Graph {
  const nodes: GraphNode[] = [];
  const connections: GraphConnection[] = [];
  const nodeIdByLabel = new Map<string, string>();
  let previousNodeId: string | undefined;
  let routeIndex = -1;

  for (const label of text.split(/\r\n?|\n/)) {
    if (label.length === 0) {
      previousNodeId = undefined;
      continue;
    }

    if (previousNodeId === undefined) {
      routeIndex += 1;
    }

    let nodeId = nodeIdByLabel.get(label);
    if (!nodeId) {
      nodeId = `node-${nodes.length + 1}`;
      nodeIdByLabel.set(label, nodeId);
      nodes.push(new GraphNode(nodeId, label));
    }

    if (previousNodeId !== undefined) {
      connections.push(
        new GraphConnection(
          `connection-${connections.length + 1}`,
          previousNodeId,
          nodeId,
          londonUndergroundColors[routeIndex % londonUndergroundColors.length],
        ),
      );
    }
    previousNodeId = nodeId;
  }

  return new Graph(nodes, connections);
}
