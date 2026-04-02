import { Component } from '@angular/core';

import { NewDiagramRequestService } from './new-diagram-request.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'GE Vernova';

  constructor(private readonly newDiagramRequest: NewDiagramRequestService) {}

  onRequestNewDiagram(): void {
    this.newDiagramRequest.requestNew();
  }
}
