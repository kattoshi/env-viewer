import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CurrentValue, HistoryMode, HistoryResponse } from '../models/history.model';

/** 履歴取得APIとのHTTP通信を担当する。 */
@Injectable({ providedIn: 'root' })
export class HistoryApiService {
  /** HTTPリクエストを実行するクライアント。 */
  private readonly http = inject(HttpClient);
  /** ng serveではproxy.conf.json経由でenv-monitor.localへ転送されるAPIのベースURL。 */
  private readonly baseUrl = '/api';

  /** 指定期間と取得モードで履歴を取得する。
   * @param start 取得期間の開始日時。
   * @param end 取得期間の終了日時。
   * @param mode 取得する計測データのモード。
   * @returns 履歴APIのレスポンスを通知するObservable。
   */
  getHistory(start: Date, end: Date, mode: HistoryMode): Observable<HistoryResponse> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString())
      .set('mode', mode);

    return this.http.get<HistoryResponse>(`${this.baseUrl}/history`, { params });
  }

  /** 現在の環境計測値を取得する。
   * @returns 現在の気温、気圧、湿度を含むレスポンスを通知するObservable。
   */
  getCurrent(): Observable<CurrentValue> {
    return this.http.get<CurrentValue>('/current');
  }
}
