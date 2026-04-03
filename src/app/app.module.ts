import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material/material.module';
import { NodeEditorComponent } from './node-editor/node-editor.component';
import { DiagramWorkspaceComponent } from './diagram-workspace/diagram-workspace.component';
import { SldIoMessageComponent } from './sld-io-message/sld-io-message.component';

@NgModule({
  declarations: [
    AppComponent,
    NodeEditorComponent,
    DiagramWorkspaceComponent,
    SldIoMessageComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
