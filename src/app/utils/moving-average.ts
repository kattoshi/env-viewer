/** 時系列データ1点 */
export interface TimePoint {
  /** 計測日時。 */
  ts: Date;
  /** 計測値。 */
  value: number;
}

/**
 * 単純移動平均を計算する。
 * mode=1 のデータは毎時0分の1点/hour前提のため、windowDays * 24 点分を窓幅とする。
 * @param points 時系列順に並んだ計測値。
 * @param windowDays 移動平均の窓幅とする日数。
 * @returns 移動平均を適用した時系列データ。
 */
export function movingAverageByDays(points: TimePoint[], windowDays: number): TimePoint[] {
  const windowSize = windowDays * 24;
  if (windowSize <= 1 || points.length === 0) {
    return points;
  }

  const result: TimePoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += points[i].value;
    if (i >= windowSize) {
      sum -= points[i - windowSize].value;
    }
    const count = Math.min(i + 1, windowSize);
    result.push({ ts: points[i].ts, value: sum / count });
  }
  return result;
}
