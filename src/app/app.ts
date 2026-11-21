import { Component, inject } from '@angular/core';
import { GraphVisualization } from './graph-visualization/graph-visualization';
import { exampleGraph } from './models/example-graph';
import { DagreGraphLayoutService } from './services/dagre-graph-layout.service';

@Component({
  imports: [GraphVisualization],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly graph = exampleGraph;
  private readonly graphLayoutService = inject(DagreGraphLayoutService);
  protected readonly layout = this.graphLayoutService.createLayout(this.graph);
}
