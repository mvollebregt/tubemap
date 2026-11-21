import { Component, computed, inject, signal } from '@angular/core';
import { GraphVisualization } from './graph-visualization/graph-visualization';
import { GraphTextEditor } from './graph-text-editor/graph-text-editor';
import { exampleGraphText } from './models/example-graph';
import { parseGraphText } from './models/graph-text';
import { DagreGraphLayoutService } from './services/dagre-graph-layout.service';

@Component({
  imports: [GraphTextEditor, GraphVisualization],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly graphText = signal(exampleGraphText);
  protected readonly graph = computed(() => parseGraphText(this.graphText()));
  private readonly graphLayoutService = inject(DagreGraphLayoutService);
  protected readonly layout = computed(() => this.graphLayoutService.createLayout(this.graph()));
}
