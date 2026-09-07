import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoryMode, HistoryResponse } from '../models/history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  /** ng serve では proxy.conf.json 経由で env-monitor.local へ転送される */
  private readonly baseUrl = '/api';

  getHistory(start: Date, end: Date, mode: HistoryMode): Observable<HistoryResponse> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('mode', mode);

    return this.http.get<HistoryResponse>(`${this.baseUrl}/history`, { params });
  }
}
