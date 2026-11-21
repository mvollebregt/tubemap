import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { exampleGraphText } from './models/example-graph';
import { parseGraphText } from './models/graph-text';
import { DagreGraphLayoutService } from './services/dagre-graph-layout.service';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the example graph', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Een netwerk in beeld');
    expect(compiled.querySelectorAll('app-graph-visualization circle.point-marker').length).toBe(8);
    expect(compiled.querySelectorAll('app-graph-visualization line').length).toBe(10);

    const expectedGraph = parseGraphText(exampleGraphText);
    const expectedLayout = TestBed.inject(DagreGraphLayoutService).createLayout(expectedGraph);
    const firstPoint = expectedLayout.points[0];
    expect(compiled.querySelector('.point')?.getAttribute('transform')).toBe(
      `translate(${firstPoint.x} ${firstPoint.y})`,
    );
  });

  it('updates the rendered graph when the text input changes', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const textarea = compiled.querySelector('textarea');
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error('De graafinvoer moet een tekstveld bevatten.');
    }

    textarea.value = 'Alpha\nBeta\n\nGamma\nAlpha';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.point')).toHaveLength(3);
    const lines = compiled.querySelectorAll<SVGLineElement>('.connections line');
    expect(lines).toHaveLength(2);
    expect(lines[0].style.stroke).toBe('rgb(179, 99, 5)');
    expect(lines[1].style.stroke).toBe('rgb(227, 32, 23)');
    expect(compiled.querySelectorAll('.point[aria-label="Alpha"]')).toHaveLength(1);
  });
});
