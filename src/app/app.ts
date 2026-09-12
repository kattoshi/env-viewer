import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import 'chartjs-adapter-date-fns';
import { HistoryFacade } from './application/history.facade';

@Component({
  selector: 'app-root',
  imports: [BaseChartDirective, DecimalPipe],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  /** 履歴画面の状態とユースケースを提供するFacade。 */
  private readonly historyFacade = inject(HistoryFacade);

  /** 画面タイトル。 */
  protected readonly title = signal('環境モニター');
  /** 画面で選択できる履歴期間の一覧。 */
  protected readonly periodOptions = this.historyFacade.periodOptions;
  /** 画面で選択できる計測リソースの一覧。 */
  protected readonly resourceOptions = this.historyFacade.resourceOptions;
  /** 選択中の履歴期間。 */
  protected readonly selectedPeriodKind = this.historyFacade.selectedPeriodKind;
  /** 選択中の計測リソース。 */
  protected readonly selectedResourceKind = this.historyFacade.selectedResourceKind;
  /** 選択中の移動平均日数。 */
  protected readonly selectedMovingAverageDays = this.historyFacade.selectedMovingAverageDays;
  /** 選択中の期間設定。 */
  protected readonly selectedPeriod = this.historyFacade.selectedPeriod;
  /** 履歴データの読み込み状態。 */
  protected readonly loading = this.historyFacade.loading;
  /** 履歴取得エラーメッセージ。 */
  protected readonly error = this.historyFacade.error;
  /** グラフへ渡すデータ。 */
  protected readonly chartData = this.historyFacade.chartData;
  /** グラフの表示設定。 */
  protected readonly chartOptions = this.historyFacade.chartOptions;
  /** センサーから取得した現在値。 */
  protected readonly currentValue = this.historyFacade.currentValue;
  /** 現在値の読み込み状態。 */
  protected readonly currentLoading = this.historyFacade.currentLoading;
  /** 現在値取得時のエラーメッセージ。 */
  protected readonly currentError = this.historyFacade.currentError;
}
