import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialModule } from '../material/material.module';
import { NodeEditorComponent } from './node-editor.component';

describe('NodeEditorComponent', () => {
  let fixture: ComponentFixture<NodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NodeEditorComponent],
      imports: [MaterialModule],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeEditorComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
