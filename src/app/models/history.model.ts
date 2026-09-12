/** /api/history の1レコード分の計測値 */
export interface HistoryValue {
  /** 計測日時。 */
  ts: string;
  /** 気温。 */
  t: number;
  /** 気圧。 */
  p: number;
  /** 湿度。 */
  h: number;
  /** サーバー側で記録された作成日時または補助時刻。 */
  ct: number;
}

/** /api/historyから返される履歴取得結果。 */
export interface HistoryResponse {
  /** APIが認識した取得期間。 */
  period: {
    /** 取得期間の開始日時。 */
    start: string;
    /** 取得期間の終了日時。 */
    end: string;
  };
  /** 取得された計測値の一覧。 */
  values: HistoryValue[];
}

/** /api/currentから返される現在の環境計測値。 */
export interface CurrentValue {
  /** 気温。 */
  temp: number;
  /** 気圧。 */
  pressure: number;
  /** 湿度。 */
  humidity: number;
  /** センサーまたは端末のCPU温度。 */
  cpu_temp: number;
}

/** 履歴取得APIのモード (0: 全レコード, 1: 毎時0分の値のみ) */
export type HistoryMode = 0 | 1;

/** 計測リソースの種別 */
export type ResourceKind = 't' | 'h' | 'p';

/** 期間選択の種別 */
export type PeriodKind = '24h' | '7d' | '1m' | '3m' | '1y';

export interface PeriodOption {
  /** 期間種別。 */
  kind: PeriodKind;
  /** 画面に表示する期間名。 */
  label: string;
  /** APIへ渡す取得モード。 */
  mode: HistoryMode;
  /** 移動平均の日数候補 (未指定なら移動平均なし) */
  movingAverageDaysOptions?: number[];
  /** 既定の移動平均日数 */
  defaultMovingAverageDays?: number;
}

export interface ResourceOption {
  /** リソース種別。 */
  kind: ResourceKind;
  /** 画面に表示するリソース名。 */
  label: string;
  /** グラフの単位。 */
  unit: string;
}
