import { Graph, GraphConnection, GraphNode } from './graph';

export function parseGraphText(text: string): Graph {
  const nodes: GraphNode[] = [];
  const connections: GraphConnection[] = [];
  const nodeIdByLabel = new Map<string, string>();
  let previousNodeId: string | undefined;

  for (const label of text.split(/\r\n?|\n/)) {
    if (label.length === 0) {
      previousNodeId = undefined;
      continue;
    }

    let nodeId = nodeIdByLabel.get(label);
    if (!nodeId) {
      nodeId = `node-${nodes.length + 1}`;
      nodeIdByLabel.set(label, nodeId);
      nodes.push(new GraphNode(nodeId, label));
    }

    if (previousNodeId !== undefined) {
      connections.push(
        new GraphConnection(`connection-${connections.length + 1}`, previousNodeId, nodeId),
      );
    }
    previousNodeId = nodeId;
  }

  return new Graph(nodes, connections);
}
