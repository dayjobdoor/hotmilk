---
name: make-docs
description: "Greenfield: create docs/* (9 files), README.md from interview or repo scan. If docs/ or README.md already exists, stop — use doc sync instead. [Triggers: /make-docs, create docs, init docs, generate AGENTS.md]"
disable-model-invocation: true
---

# /make-docs — Documentation bootstrap

**前提**: `docs/` も `README.md` も無いリポジトリだけ。既にあるなら **update-docs 系に切り替え**。このスキルは初回スキャフォールド用で、勝手に上書きしない。

## モード選択（最初に確定・途中で混ぜない）

```
リポジトリ無し / 仕様だけ → Interactive（2〜3 問ずつ）
リポジトリあり かつ docs と AGENTS が無い → Auto-scan（下の bash）→ 足りない所だけ短命インタビュー
docs または AGENTS が既にある → **STOP**（同期ワークフローへ）
```

## Auto-scan（プロジェクトルートで実行）

```bash
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' -not -path '*/build/*' -not -path '*/target/*' | head -100
cat README.md AGENTS.md 2>/dev/null
cat package.json 2>/dev/null || cat Cargo.toml 2>/dev/null || cat pyproject.toml 2>/dev/null
```

## 現在のプロジェクトのファイルを読み内容に合わせて作成、またはインタラクティブに作成

## progresive disclosure

- `./docs/requirements.md` (要件定義)
- `./docs/design.md` (詳細設計、スキーマ設計)
- `./docs/directory.md` (ディレクトリ構成)
- `./docs/tech.md` (技術スタック)
- `./docs/tasks.md` (タスク管理、進捗管理)
- `./docs/test.md` (テスト設計、テストガイド)
- `./docs/security.md` (セキュリティ設計)
- `./docs/problems.md` (注意点、落とし穴)
- `./docs/references.md` (参考文献、サンプルコード)

## テーブル, mermaidダイアグラム

- 必要に応じてtasks.md と連動した `ROADMAP.md` も作成
