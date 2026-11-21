import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { exampleGraph } from './models/example-graph';
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

    const expectedLayout = TestBed.inject(DagreGraphLayoutService).createLayout(exampleGraph);
    const firstPoint = expectedLayout.points[0];
    expect(compiled.querySelector('.point')?.getAttribute('transform')).toBe(
      `translate(${firstPoint.x} ${firstPoint.y})`,
    );
  });
});
