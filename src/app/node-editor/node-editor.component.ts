import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEditorComponent {
  readonly diagrams: { id: string; name: string }[] = [
    { id: 'sld-1', name: 'SLD 1' },
  ];
  activeDiagramId = this.diagrams[0].id;
  private nextDiagramIndex = 2;

  addDiagram(): void {
    const name = `SLD ${this.nextDiagramIndex}`;
    const id = `sld-${this.nextDiagramIndex}`;
    this.nextDiagramIndex += 1;
    this.diagrams.push({ id, name });
    this.activeDiagramId = id;
  }

  selectDiagram(id: string): void {
    this.activeDiagramId = id;
  }

  closeDiagram(id: string, ev: MouseEvent): void {
    ev.stopPropagation();
    if (this.diagrams.length === 1) {
      return;
    }
    const idx = this.diagrams.findIndex((d) => d.id === id);
    if (idx < 0) {
      return;
    }
    this.diagrams.splice(idx, 1);
    if (this.activeDiagramId === id) {
      const fallback = this.diagrams[Math.max(0, idx - 1)];
      this.activeDiagramId = fallback.id;
    }
  }
}
