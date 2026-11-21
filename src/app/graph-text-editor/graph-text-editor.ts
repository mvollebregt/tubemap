import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-graph-text-editor',
  templateUrl: './graph-text-editor.html',
  styleUrl: './graph-text-editor.css',
})
export class GraphTextEditor {
  readonly text = input.required<string>();
  readonly textChange = output<string>();

  protected onInput(event: Event): void {
    const textarea = event.currentTarget;
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('De graafinvoer verwacht een tekstveld.');
    }

    this.textChange.emit(textarea.value);
  }
}
