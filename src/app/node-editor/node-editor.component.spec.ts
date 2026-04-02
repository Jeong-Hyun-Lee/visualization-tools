import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialModule } from '../material/material.module';
import { NewDiagramRequestService } from '../new-diagram-request.service';
import { NodeEditorComponent } from './node-editor.component';

describe('NodeEditorComponent', () => {
  let fixture: ComponentFixture<NodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NodeEditorComponent],
      imports: [MaterialModule],
      providers: [NewDiagramRequestService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeEditorComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
