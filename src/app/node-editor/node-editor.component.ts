import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NewDiagramRequestService } from '../new-diagram-request.service';

@Component({
  selector: 'app-node-editor',
  templateUrl: './node-editor.component.html',
  styleUrls: ['./node-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEditorComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly newDiagramRequest: NewDiagramRequestService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

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
}
