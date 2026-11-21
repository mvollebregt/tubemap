import { Component, input } from '@angular/core';
import { GraphLayout } from '../models/graph-layout';

@Component({
  selector: 'app-graph-visualization',
  templateUrl: './graph-visualization.html',
  styleUrl: './graph-visualization.css',
})
export class GraphVisualization {
  readonly layout = input.required<GraphLayout>();
}
