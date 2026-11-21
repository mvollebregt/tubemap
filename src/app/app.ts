import { Component, inject } from '@angular/core';
import { GraphVisualization } from './graph-visualization/graph-visualization';
import { exampleGraph } from './models/example-graph';
import { GraphLayoutService } from './services/graph-layout.service';

@Component({
  imports: [GraphVisualization],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly graph = exampleGraph;
  private readonly graphLayoutService = inject(GraphLayoutService);
  protected readonly layout = this.graphLayoutService.createLayout(this.graph);
}
