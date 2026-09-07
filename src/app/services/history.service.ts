import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoryMode, HistoryResponse } from '../models/history.model';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly http = inject(HttpClient);
  /** ng serve では proxy.conf.json 経由で env-monitor.local へ転送される */
  private readonly baseUrl = '/api';

  /**
   * 指定期間・取得モードの計測履歴をAPIから取得する。
   * @param start 取得期間の開始日時。
   * @param end 取得期間の終了日時。
   * @param mode 取得する計測データのモード。
   * @returns 計測履歴を含むレスポンス。
   */
  getHistory(start: Date, end: Date, mode: HistoryMode): Observable<HistoryResponse> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('mode', mode);

    return this.http.get<HistoryResponse>(`${this.baseUrl}/history`, { params });
  }
}
