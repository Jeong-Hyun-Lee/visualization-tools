import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AppLanguage,
  AppPreferencesService,
  AppTheme,
} from './app-preferences.service';
import { NewDiagramRequestService } from './new-diagram-request.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'GE Vernova';

  theme: AppTheme = 'light';
  language: AppLanguage = 'ko';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly newDiagramRequest: NewDiagramRequestService,
    private readonly preferences: AppPreferencesService,
  ) {}

  ngOnInit(): void {
    this.preferences.syncDom();
    this.theme = this.preferences.theme;
    this.language = this.preferences.language;

    this.preferences.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((t) => {
        this.theme = t;
      });

    this.preferences.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe((l) => {
        this.language = l;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRequestNewDiagram(): void {
    this.newDiagramRequest.requestNew();
  }

  onThemeSelect(theme: AppTheme): void {
    this.preferences.setTheme(theme);
  }

  onLanguageSelect(lang: AppLanguage): void {
    this.preferences.setLanguage(lang);
  }
}
