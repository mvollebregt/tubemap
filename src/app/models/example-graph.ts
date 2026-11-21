import { Graph, GraphConnection, GraphNode } from './graph';

export const exampleGraph = new Graph(
  [
    new GraphNode('centraal', 'Centraal'),
    new GraphNode('museum', 'Museumkwartier'),
    new GraphNode('noord', 'Noord'),
    new GraphNode('haven', 'Haven'),
    new GraphNode('park', 'Parklaan'),
    new GraphNode('universiteit', 'Universiteit'),
    new GraphNode('west', 'Westpoort'),
    new GraphNode('zuid', 'Zuid'),
  ],
  [
    new GraphConnection('route-1', 'centraal', 'museum'),
    new GraphConnection('route-2', 'centraal', 'noord'),
    new GraphConnection('route-3', 'centraal', 'haven'),
    new GraphConnection('route-4', 'museum', 'park'),
    new GraphConnection('route-5', 'park', 'universiteit'),
    new GraphConnection('route-6', 'universiteit', 'zuid'),
    new GraphConnection('route-7', 'zuid', 'haven'),
    new GraphConnection('route-8', 'haven', 'west'),
    new GraphConnection('route-9', 'west', 'noord'),
    new GraphConnection('route-10', 'noord', 'park'),
  ],
);
