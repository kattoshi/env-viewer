# 温度、湿度、気圧を見える化する SPA

- プロジェクト名は、env-viewer として、 このREADME.md のフォルダーへ以下の開発環境でプロジェクトを作成する
  - フレームワークは、最新の Angular
  - nodeのバージョンは最新
  - SPA
  - 使用している開発環境の独立性を高めるため、開発コンテナーの中で開発を行う
  - 開発コードは、githubにて管理する(現段階では未作成)
    - user.email = urabe@mcomp.co.jp
    - user.name = kattoshi

- リソース取得元
  - http://env-monitor.local サーバーをアクセスしてデーターを取得する
  - 仕様書は、https://github.com/kattoshi/env-logger/blob/main/readme.md の /api/history を利用する

- UI仕様
  - 画面上に折れ線グラフで、気温、湿度、気圧の履歴や比較を表示する
  - 履歴表示
    - 履歴選択期間は以下の通り
      以下をプルダウンメニューなどで選択する
      - 過去24H
        mode=0で取得
        全ての計測データをプロット
      - 過去7日
        mode=0で取得
        全ての計測データをプロット
      - 過去1ヶ月
        mode=1で取得(毎時0分)
        1日間移動平均で表示
      - 過去3ヶ月
        mode=1で取得(毎時0分)
        7日間移動平均で表示
      - 過去1年
        mode=1で取得(毎時0分)。
        7日間移動平均、30日間移動平均のグラフを選択可能
    - 表示する計測リソース
      以下をプルダウンメニューなどで選択する
      - 気温
      - 湿度
      - 気圧
    - グラフの横軸は、日付または時刻
      - 過去24H
        hh:mm
      - 過去7日
        mm/dd hh:mm
      - 過去1ヶ月
        mm/dd
      - 過去3ヶ月
        mm/dd
      - 過去1年
        mm/dd
  - 比較
    - 仕様検討中。後日実装

## 開発コマンド (Angular CLI)

このプロジェクトは [Angular CLI](https://github.com/angular/angular-cli) (v22.1.7) で生成されています。

### 開発サーバー起動

```bash
npm start
```

`http://localhost:4200/` で確認できます。ソースファイル変更時は自動的にリロードされます。
`env-monitor.local` へのAPIアクセスは [proxy.conf.json](proxy.conf.json) 経由でプロキシされます。

### コード生成

```bash
ng generate component component-name
```

利用可能なスキーマティクス一覧は `ng generate --help` を参照。

### ビルド

```bash
npm run build
```

`dist/` ディレクトリに成果物を出力します。

### env-monitor.local への配置用ビルド

```bash
npm run publish
```

`ng build --base-href=/ --deploy-url=/` を実行し、配置先サーバーのルート直下に配置できる形式で出力します。

### テスト

```bash
npm test
```

[Vitest](https://vitest.dev/) を使用します。

### Angular CLI 参考資料

詳細は [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) を参照してください。
