import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { subDays, subHours, subMonths, subYears } from 'date-fns';
import { timer } from 'rxjs';
import { HistoryService } from './services/history.service';
import { movingAverageByDays, TimePoint } from './utils/moving-average';
import {
  HistoryValue,
  PeriodKind,
  PeriodOption,
  ResourceKind,
  ResourceOption,
} from './models/history.model';

@Component({
  selector: 'app-root',
  imports: [BaseChartDirective],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly destroyRef = inject(DestroyRef);
  private readonly historyService = inject(HistoryService);

  protected readonly title = signal('env-viewer');

  protected readonly periodOptions: PeriodOption[] = [
    { kind: '24h', label: '過去24時間', mode: 0 },
    { kind: '7d', label: '過去7日', mode: 0 },
    { kind: '1m', label: '過去1ヶ月', mode: 1, movingAverageDaysOptions: [1], defaultMovingAverageDays: 1 },
    { kind: '3m', label: '過去3ヶ月', mode: 1, movingAverageDaysOptions: [7], defaultMovingAverageDays: 7 },
    { kind: '1y', label: '過去1年', mode: 1, movingAverageDaysOptions: [7, 30], defaultMovingAverageDays: 7 },
  ];

  protected readonly resourceOptions: ResourceOption[] = [
    { kind: 't', label: '気温', unit: '℃' },
    { kind: 'h', label: '湿度', unit: '%' },
    { kind: 'p', label: '気圧', unit: 'hPa' },
  ];

  protected readonly selectedPeriodKind = signal<PeriodKind>('24h');
  protected readonly selectedResourceKind = signal<ResourceKind>('t');
  protected readonly selectedMovingAverageDays = signal<number>(1);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly chartData = signal<ChartData<'line', { x: number; y: number }[]>>({
    datasets: [],
  });
  protected readonly chartOptions = signal<ChartConfiguration<'line'>['options']>({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: { beginAtZero: false },
    },
  });

  protected readonly selectedPeriod = computed(
    () => this.periodOptions.find((p) => p.kind === this.selectedPeriodKind())!
  );
  protected readonly selectedResource = computed(
    () => this.resourceOptions.find((r) => r.kind === this.selectedResourceKind())!
  );

  /**
    * 選択変更時の取得処理と定期更新を初期化する。
   */
  constructor() {
    // 期間変更時は既定の移動平均日数へリセットする
    effect(() => {
      const period = this.selectedPeriod();
      if (period.defaultMovingAverageDays) {
        this.selectedMovingAverageDays.set(period.defaultMovingAverageDays);
      }
    });

    // 選択条件の変化を検知してデータを再取得する
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
      });
  }

  /**
    * 選択中の期間・リソースの履歴データを取得する。
   */
  private load(): void {
    const period = this.selectedPeriod();
    const end = new Date();
    const start = this.computeStart(period.kind, end);

    this.loading.set(true);
    this.error.set(null);

    this.historyService.getHistory(start, end, period.mode).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.applyResponse(period, res.values, start, end);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('データ取得に失敗しました。env-monitor.local に接続できません。');
        this.chartData.set({ datasets: [] });
        console.error(err);
      },
    });
  }

  /**
    * 指定期間の開始日時を計算する。
   */
  private computeStart(kind: PeriodKind, end: Date): Date {
    switch (kind) {
      case '24h':
        return subHours(end, 24);
      case '7d':
        return subDays(end, 7);
      case '1m':
        return subMonths(end, 1);
      case '3m':
        return subMonths(end, 3);
      case '1y':
        return subYears(end, 1);
    }
  }

  /**
    * APIレスポンスを選択条件に合わせてグラフデータへ変換する。
   */
  private applyResponse(
    period: PeriodOption,
    values: HistoryValue[],
    start: Date,
    end: Date
  ): void {
    const resourceKind = this.selectedResourceKind();
    // API は時刻降順(最新→過去)で返却されるため昇順に並べ替える
    const points: TimePoint[] = [...values]
      .reverse()
      .map((v) => ({ ts: new Date(v.ts), value: v[resourceKind] }));

    const plotted = period.movingAverageDaysOptions
      ? movingAverageByDays(points, this.selectedMovingAverageDays())
      : points;

    const resource = this.selectedResource();

    this.chartData.set({
      datasets: [
        {
          label: `${resource.label} (${resource.unit})`,
          data: plotted.map((p) => ({ x: p.ts.getTime(), y: Number(p.value.toFixed(2)) })),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          pointRadius: 0,
          tension: 0.2,
          // データが欠測している区間は前後の値をそのまま結んで表示する
          spanGaps: true,
        },
      ],
    });

    this.chartOptions.set({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        // 取得できたデータ点数に関わらず、選択期間全体を軸に表示する
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

  /**
    * 期間に応じたグラフ横軸の時間単位を返す。
   */
  private timeUnitFor(kind: PeriodKind): 'hour' | 'day' | 'month' {
    switch (kind) {
      case '24h':
        return 'hour';
      case '7d':
        return 'day';
      default:
        return 'day';
    }
  }

  /**
    * 期間に応じたグラフ横軸ラベルの書式を返す。
   */
  private tickFormatFor(kind: PeriodKind): string {
    switch (kind) {
      case '24h':
        return 'HH:mm';
      case '7d':
        return 'MM/dd HH:mm';
      default:
        return 'MM/dd';
    }
  }
}
