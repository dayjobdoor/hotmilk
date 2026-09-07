---
name: make-docs
description: "Use when a repository needs initial documentation and has none of docs/, README.md, or AGENTS.md. For existing documentation, use update-docs to reconcile factual drift instead."
disable-model-invocation: true
---

# /make-docs — Documentation bootstrap

**前提**: `docs/`、`README.md`、`AGENTS.md` のいずれかが存在するリポジトリでは **STOP** — `update-docs` で事実との差分を同期する。既存文書を固定ファイル構成へ膨らませない。

## モード選択（最初に確定・途中で混ぜない）

```
リポジトリ無し / 仕様だけ → Interactive（2〜3 問ずつ）
リポジトリあり かつ docs、README、AGENTS が無い → Auto-scan（下の bash）→ 足りない所だけ短命インタビュー
docs、README、または AGENTS が既にある → **STOP**（同期ワークフローへ）
```

## Interactive interview

不足情報だけを、次の順で質問する。

1. 誰が読む文書か、何を決める文書か
2. commands、defaults、公開範囲の source of truth は何か
3. 各 topic の保守主体は誰か

回答が不足する topic は作らず `Unknowns` に記録する。全ての作成文書に内容・source・owner が揃ったら終了する。

## Auto-scan（プロジェクトルートで実行）

```bash
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/build/*' -not -path '*/target/*' | head -100
find . -type f \( -name package.json -o -name Cargo.toml -o -name pyproject.toml -o -name setup.py -o -name go.mod -o -name pom.xml -o -name 'build.gradle*' \) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/build/*' -not -path '*/target/*' -print -exec cat {} +
cat README.md AGENTS.md 2>/dev/null
```

上記コマンドは候補収集用。先頭100件だけを完全な inventory と見なさない。認識できる manifest が無い場合は scripts や依存関係を推測せず、既存ファイルを確認して短命インタビューへ進む。

対応する manifest は全種類の存在を確認してから unknown と判定する。monorepo では root と package の manifest を区別する。

## 現在のプロジェクトのファイルを読み内容に合わせて作成、またはインタラクティブに作成

## Recommended document catalog

以下は推奨トピック。内容と保守主体がある文書だけ作る。既存文書を rename、split、overwrite してカタログへ合わせない。

- `./docs/requirements.md` (要件定義)
- `./docs/design.md` (詳細設計、スキーマ設計)
- `./docs/directory.md` (ディレクトリ構成)
- `./docs/tech.md` (技術スタック)
- `./docs/roadmap.md` (任意: 長期的な方向性、優先順位、マイルストーン。日々のタスク管理には使わない)
- `./docs/test.md` (テスト設計、テストガイド)
- `./docs/security.md` (セキュリティ設計)
- `./docs/problems.md` (注意点、落とし穴)
- `./docs/references.md` (参考文献、サンプルコード)

## テーブル, mermaidダイアグラム

- 実装タスクと進捗はプロジェクトの task/plan system で管理し、`docs/tasks.md` は作らない。

`docs/README.md` などの docs index は navigation artifact。推奨 topic の1つではなく、docs tree の到達性に必要な場合だけ作る。

## NEVER

- 既存 docs を bootstrap しない。所有権と既存の情報構造を壊すため
- commands、defaults、dependencies を推測しない。誤った docs を正本にしないため
- 空の catalog file を作らない。filename の存在は coverage ではないため
- `docs/tasks.md` を作らない。実装状態は task/plan system の責務
- navigation が不要な docs index を作らない。参照経路のない入口を増やすため

## Verify

生成後、作成した文書だけ確認する。

- 内部リンクの対象パスが存在する
- README を作成した場合は主要文書へ到達できる
- 空の placeholder 文書がない
- 各文書に source of truth と保守主体がある
- 作成しなかった推奨 topic と理由を記録する

## Bootstrap report

以下を報告する。

- Created: 作成した文書
- Skipped: 作成しなかった topic と理由
- Sources/owners: 各文書の source of truth と保守主体
- Unknowns: 未確認の事実、追加確認が必要な点
