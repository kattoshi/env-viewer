import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartData } from 'chart.js';
import { subDays, subHours, subMonths, subYears } from 'date-fns';
import { timer } from 'rxjs';
import { HistoryApiService } from '../infrastructure/history-api.service';
import {
  CurrentValue,
  HistoryValue,
  PeriodKind,
  PeriodOption,
  ResourceKind,
  ResourceOption,
} from '../models/history.model';
import { movingAverageByDays, TimePoint } from '../utils/moving-average';

/** 履歴画面の状態管理と履歴取得ユースケースを提供する。 */
@Injectable({ providedIn: 'root' })
export class HistoryFacade {
  /** コンポーネント破棄時に購読を終了するための参照。 */
  private readonly destroyRef = inject(DestroyRef);
  /** 履歴APIへアクセスするインフラストラクチャーサービス。 */
  private readonly historyApi = inject(HistoryApiService);

  /** 画面で選択できる履歴期間の一覧。 */
  readonly periodOptions: PeriodOption[] = [
    { kind: '24h', label: '過去24時間', mode: 0 },
    { kind: '7d', label: '過去7日', mode: 0 },
    { kind: '1m', label: '過去1ヶ月', mode: 1, movingAverageDaysOptions: [1], defaultMovingAverageDays: 1 },
    { kind: '3m', label: '過去3ヶ月', mode: 1, movingAverageDaysOptions: [7], defaultMovingAverageDays: 7 },
    { kind: '1y', label: '過去1年', mode: 1, movingAverageDaysOptions: [7, 30], defaultMovingAverageDays: 7 },
  ];

  /** 画面で選択できる計測リソースの一覧。 */
  readonly resourceOptions: ResourceOption[] = [
    { kind: 't', label: '気温', unit: '℃' },
    { kind: 'h', label: '湿度', unit: '%' },
    { kind: 'p', label: '気圧', unit: 'hPa' },
  ];

  /** 選択中の履歴期間。 */
  readonly selectedPeriodKind = signal<PeriodKind>('24h');
  /** 選択中の計測リソース。 */
  readonly selectedResourceKind = signal<ResourceKind>('t');
  /** 選択中の移動平均日数。 */
  readonly selectedMovingAverageDays = signal(1);
  /** 履歴データの読み込み状態。 */
  readonly loading = signal(false);
  /** 履歴取得エラーメッセージ。 */
  readonly error = signal<string | null>(null);
  /** グラフへ渡すデータ。 */
  readonly chartData = signal<ChartData<'line', { x: number; y: number }[]>>({ datasets: [] });
  /** グラフの表示設定。 */
  readonly chartOptions = signal<ChartConfiguration<'line'>['options']>(this.defaultChartOptions());
  /** センサーから取得した現在値。 */
  readonly currentValue = signal<CurrentValue | null>(null);
  /** 現在値の読み込み状態。 */
  readonly currentLoading = signal(false);
  /** 現在値取得時のエラーメッセージ。 */
  readonly currentError = signal<string | null>(null);

  /** 選択中の期間設定。 */
  readonly selectedPeriod = computed(
    () => this.periodOptions.find((period) => period.kind === this.selectedPeriodKind())!
  );
  /** 選択中のリソース設定。 */
  readonly selectedResource = computed(
    () => this.resourceOptions.find((resource) => resource.kind === this.selectedResourceKind())!
  );

  /** 初期状態を設定し、選択変更と定期更新による取得処理を登録する。 */
  constructor() {
    effect(() => {
      const period = this.selectedPeriod();
      if (period.defaultMovingAverageDays) {
        this.selectedMovingAverageDays.set(period.defaultMovingAverageDays);
      }
    });

    effect(() => {
      this.selectedPeriodKind();
      this.selectedResourceKind();
      this.selectedMovingAverageDays();
      this.load();
    });

    const refreshIntervalMilliseconds = 10 * 60 * 1000;
    const nextRefreshAt = new Date();
    nextRefreshAt.setMinutes(Math.floor(nextRefreshAt.getMinutes() / 10) * 10);
    nextRefreshAt.setSeconds(30, 0);
    if (nextRefreshAt.getTime() <= Date.now()) {
      nextRefreshAt.setMinutes(nextRefreshAt.getMinutes() + 10);
    }

    timer(nextRefreshAt.getTime() - Date.now(), refreshIntervalMilliseconds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const periodKind = this.selectedPeriodKind();
        if (periodKind === '24h' || periodKind === '7d') {
          this.load();
        }
        this.loadCurrent();
      });

    this.loadCurrent();
  }

  /** 選択条件に応じた履歴を取得し、画面状態を更新する。 */
  private load(): void {
    const period = this.selectedPeriod();
    const end = new Date();
    const start = this.computeStart(period.kind, end);

    this.loading.set(true);
    this.error.set(null);

    this.historyApi.getHistory(start, end, period.mode).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.updateChart(period, response.values, start, end);
      },
      error: (error) => {
        this.loading.set(false);
        this.error.set('データ取得に失敗しました。env-monitor.local に接続できません。');
        this.chartData.set({ datasets: [] });
        console.error(error);
      },
    });
  }

  /** 現在値を取得し、画面表示用の状態を更新する。 */
  private loadCurrent(): void {
    this.currentLoading.set(true);
    this.currentError.set(null);

    this.historyApi.getCurrent().subscribe({
      next: (currentValue) => {
        this.currentLoading.set(false);
        this.currentValue.set(currentValue);
      },
      error: (error) => {
        this.currentLoading.set(false);
        this.currentError.set('現在値の取得に失敗しました。');
        console.error(error);
      },
    });
  }

  /** 指定された期間種別から取得開始日時を計算する。
   * @param kind 期間種別。
   * @param end 取得終了日時。
   * @returns 取得開始日時。
   */
  private computeStart(kind: PeriodKind, end: Date): Date {
    switch (kind) {
      case '24h': return subHours(end, 24);
      case '7d': return subDays(end, 7);
      case '1m': return subMonths(end, 1);
      case '3m': return subMonths(end, 3);
      case '1y': return subYears(end, 1);
    }
  }

  /** 履歴値を移動平均とChart.js形式へ変換してグラフ状態を更新する。
   * @param period 選択中の期間設定。
   * @param values APIから取得した履歴値。
   * @param start グラフ表示範囲の開始日時。
   * @param end グラフ表示範囲の終了日時。
   */
  private updateChart(period: PeriodOption, values: HistoryValue[], start: Date, end: Date): void {
    const points: TimePoint[] = [...values]
      .reverse()
      .map((value) => ({ ts: new Date(value.ts), value: value[this.selectedResourceKind()] }));
    const plotted = period.movingAverageDaysOptions
      ? movingAverageByDays(points, this.selectedMovingAverageDays())
      : points;
    const resource = this.selectedResource();

    this.chartData.set({
      datasets: [{
        label: `${resource.label} (${resource.unit})`,
        data: plotted.map((point) => ({ x: point.ts.getTime(), y: Number(point.value.toFixed(2)) })),
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        pointRadius: 0,
        tension: 0.2,
        spanGaps: true,
      }],
    });

    this.chartOptions.set({
      ...this.defaultChartOptions(),
      scales: {
        x: {
          type: 'time',
          min: start.getTime(),
          max: end.getTime(),
          time: {
            unit: this.timeUnitFor(period.kind),
            tooltipFormat: this.tickFormatFor(period.kind),
            displayFormats: {
              hour: this.tickFormatFor('24h'),
              day: this.tickFormatFor(period.kind),
              month: 'MM/dd',
            },
          },
        },
        y: { beginAtZero: false },
      },
    });
  }

  /** グラフの共通初期設定を生成する。
   * @returns Chart.jsのグラフ設定。
   */
  private defaultChartOptions(): ChartConfiguration<'line'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: { y: { beginAtZero: false } },
    };
  }

  /** 期間種別に対応する横軸の時間単位を返す。
   * @param kind 期間種別。
   * @returns Chart.jsで使用する時間単位。
   */
  private timeUnitFor(kind: PeriodKind): 'hour' | 'day' | 'month' {
    return kind === '24h' ? 'hour' : 'day';
  }

  /** 期間種別に対応する横軸ラベルの書式を返す。
   * @param kind 期間種別。
   * @returns date-fns形式の日時フォーマット。
   */
  private tickFormatFor(kind: PeriodKind): string {
    if (kind === '24h') return 'H時';
    if (kind === '7d') return 'MM/dd H時';
    return 'MM/dd';
  }
}
