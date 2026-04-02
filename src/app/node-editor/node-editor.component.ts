import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NewDiagramRequestService } from '../new-diagram-request.service';
import { parseSldImportPayload } from './sld-import-payload';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEditorComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @ViewChild('globalImportInput', { static: true })
  globalImportInput!: ElementRef<HTMLInputElement>;

  constructor(
    private readonly newDiagramRequest: NewDiagramRequestService,
    private readonly cdr: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  @HostListener('document:keydown', ['$event'])
  onDocKeydownImport(ev: KeyboardEvent): void {
    const target = ev.target as HTMLElement | null;
    const inEditable =
      target != null &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true');

    if (
      (ev.ctrlKey || ev.metaKey) &&
      !ev.shiftKey &&
      !ev.altKey &&
      ev.code === 'KeyI'
    ) {
      if (inEditable) {
        return;
      }
      ev.preventDefault();
      this.openGlobalImport();
    }
  }

  ngOnInit(): void {
    this.newDiagramRequest.requested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.addDiagram();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Properties 패널 목업용 (도메인 연동 없음) */
  mockVoltage = '345';
  mockState = 'normal';
  mockTagId = 'SLD-BUS-001';

  diagrams: { id: string; name: string }[] = [
    { id: 'sld-1', name: 'SLD 1' },
  ];
  activeDiagramId = this.diagrams[0].id;
  private nextDiagramIndex = 2;

  /** 새 탭 + Ctrl+I 가져오기 시 한 번만 자식에 전달 */
  pendingImport: { diagramId: string; cells: object[] } | null = null;

  addDiagram(): void {
    const name = `SLD ${this.nextDiagramIndex}`;
    const id = `sld-${this.nextDiagramIndex}`;
    this.nextDiagramIndex += 1;
    this.diagrams = [...this.diagrams, { id, name }];
    this.activeDiagramId = id;
  }

  selectDiagram(id: string): void {
    this.activeDiagramId = id;
  }

  closeDiagram(id: string, ev: Event): void {
    ev.stopPropagation();
    if (this.diagrams.length === 1) {
      return;
    }
    const idx = this.diagrams.findIndex((d) => d.id === id);
    if (idx < 0) {
      return;
    }
    const next = this.diagrams.filter((d) => d.id !== id);
    if (this.activeDiagramId === id) {
      const pick = next[idx - 1] ?? next[idx] ?? next[0];
      this.activeDiagramId = pick.id;
    }
    this.diagrams = next;
  }

  trackByDiagramId(_: number, diagram: { id: string }): string {
    return diagram.id;
  }

  pendingCellsForDiagram(diagramId: string): object[] | null {
    return this.pendingImport?.diagramId === diagramId
      ? this.pendingImport.cells
      : null;
  }

  onPendingImportConsumed(): void {
    this.pendingImport = null;
    this.cdr.markForCheck();
  }

  openGlobalImport(): void {
    const input = this.globalImportInput?.nativeElement;
    if (!input) {
      return;
    }
    input.value = '';
    input.click();
  }

  onGlobalImportFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.ngZone.run(() => {
        try {
          const raw = reader.result as string;
          const text = raw.replace(/^\uFEFF/, '');
          const parsed = JSON.parse(text) as unknown;
          const { cells } = parseSldImportPayload(parsed);
          const tabName = this.tabNameFromFileName(file.name);
          const id = `sld-${this.nextDiagramIndex}`;
          this.nextDiagramIndex += 1;
          this.pendingImport = { diagramId: id, cells };
          this.diagrams = [...this.diagrams, { id, name: tabName }];
          this.activeDiagramId = id;
          this.cdr.markForCheck();
        } catch (err) {
          const detail = err instanceof Error ? err.message : String(err);
          console.error('SLD global import failed', err);
          window.alert(`가져오기에 실패했습니다.\n${detail}`);
        }
      });
    };
    reader.onerror = () => {
      this.ngZone.run(() => {
        window.alert('파일을 읽을 수 없습니다.');
      });
    };
    reader.readAsText(file, 'utf-8');
  }

  private tabNameFromFileName(fileName: string): string {
    const base = fileName.replace(/^.*[/\\]/, '');
    const noExt = base.replace(/\.[^./\\]+$/, '').trim();
    const cleaned = noExt
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
      .slice(0, 80);
    return cleaned || '가져온 다이어그램';
  }
}
