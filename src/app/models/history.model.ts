/** /api/history の1レコード分の計測値 */
export interface HistoryValue {
  ts: string;
  t: number;
  p: number;
  h: number;
  ct: number;
}

export interface HistoryResponse {
  period: {
    start: string;
    end: string;
  };
  values: HistoryValue[];
}

/** 履歴取得APIのモード (0: 全レコード, 1: 毎時0分の値のみ) */
export type HistoryMode = 0 | 1;

/** 計測リソースの種別 */
export type ResourceKind = 't' | 'h' | 'p';

/** 期間選択の種別 */
export type PeriodKind = '24h' | '7d' | '1m' | '3m' | '1y';

export interface PeriodOption {
  kind: PeriodKind;
  label: string;
  mode: HistoryMode;
  /** 移動平均の日数候補 (未指定なら移動平均なし) */
  movingAverageDaysOptions?: number[];
  /** 既定の移動平均日数 */
  defaultMovingAverageDays?: number;
}

export interface ResourceOption {
  kind: ResourceKind;
  label: string;
  unit: string;
}
