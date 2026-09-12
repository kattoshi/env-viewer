# 環境モニターSPA

温度、湿度、気圧の履歴と現在値を表示するAngular製のSPAです。

## 概要

- プロジェクト名: `env-viewer`
- フレームワーク: Angular 22
- 実行環境: Node.js、npm
- 開発環境: Dev Container
- グラフ: Chart.js、ng2-charts
- 日付計算: date-fns
- テスト: Vitest

## API

履歴データと現在値は、次のAPIから取得します。

### 履歴API

履歴APIは環境モニターサーバーの `/api/history` を利用します。

```text
GET /api/history?start={開始日時}&end={終了日時}&mode={モード}
```

開発時は、Angularの開発サーバーから `http://env-monitor.local` へプロキシします。

### 現在値API

現在値は環境計測端末の `/current` を利用します。

```text
GET /current
```

レスポンス形式:

```json
{
  "temp": 25.3,
  "pressure": 1013.2,
  "humidity": 60.2,
  "cpu_temp": 42.1
}
```

開発時は、Angularの開発サーバーから `http://env-measure.local` へプロキシします。
プロキシ設定は [proxy.conf.json](proxy.conf.json) にあります。

## 画面仕様

### 履歴グラフ

選択した期間とリソースに応じて、折れ線グラフを表示します。

| 期間       | APIモード | 表示内容                               |
| ---------- | --------: | -------------------------------------- |
| 過去24時間 |       `0` | 全計測データ                           |
| 過去7日    |       `0` | 全計測データ                           |
| 過去1ヶ月  |       `1` | 毎時0分の値、1日間移動平均             |
| 過去3ヶ月  |       `1` | 毎時0分の値、7日間移動平均             |
| 過去1年    |       `1` | 毎時0分の値、7日間または30日間移動平均 |

選択できる計測リソースは次の3種類です。

- 気温: `℃`
- 湿度: `%`
- 気圧: `hPa`

横軸の表示形式:

- 過去24時間: `H時`
- 過去7日: `MM/dd H時`
- 過去1ヶ月、過去3ヶ月、過去1年: `MM/dd`

### 現在値

グラフ下部に、センサーから取得した現在の次の値を表示します。

- 気温
- 湿度
- 気圧

現在値は初回表示時に取得し、その後10分ごとに更新します。画面幅が狭い場合も、3項目を1行に収めて表示します。

### 未実装機能

- 複数リソースや期間の比較表示

## ソース構成

レイヤードアーキテクチャーを採用しています。

```text
src/app/
  app.ts                         プレゼンテーション層
  app.html                       画面テンプレート
  application/
    history.facade.ts            アプリケーション層
  infrastructure/
    history-api.service.ts       インフラストラクチャー層
  models/
    history.model.ts             API・画面で共有するモデル
  utils/
    moving-average.ts            移動平均のドメインロジック
```

- `App`: 画面状態とテンプレートを接続します。
- `HistoryFacade`: 履歴取得、現在値取得、定期更新、グラフデータ変換を管理します。
- `HistoryApiService`: HTTP通信とAPIエンドポイントを担当します。
- `models`: APIレスポンスと画面設定の型を定義します。

## 開発環境

Dev Containerを利用する場合は、`.devcontainer/devcontainer.json` に次のホスト名解決設定があります。

- `env-monitor.local` -> `192.168.100.105`
- `env-measure.local` -> `192.168.100.232`

ホスト側のIPアドレスを変更した場合は、`devcontainer.json` の `runArgs` も更新し、Dev Containerを再ビルドしてください。

## 開発コマンド

### 依存パッケージのインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm start
```

起動後、`http://localhost:4200/` を開きます。ソースコードの変更は自動的に反映されます。

### ビルド

```bash
npm run build
```

成果物は `dist/env-viewer` に出力されます。

### 配置用ビルド

```bash
npm run publish
```

ルートパス配信用の `base-href` と `deploy-url` を指定してビルドします。

### テスト

```bash
npm test
```

単発で実行する場合:

```bash
npm test -- --watch=false
```

## 参考資料

- [Angular CLI](https://angular.dev/tools/cli)
- [Angular](https://angular.dev/)
- [Chart.js](https://www.chartjs.org/)
- [ng2-charts](https://github.com/valor-software/ng2-charts)
- [環境モニターサーバー仕様](https://github.com/kattoshi/env-logger/blob/main/readme.md)
