# DS2アサイン丸わかりマン

## アプリ概要
DS2グループメンバーのプロジェクトアサイン状況をSalesforce APIから取得し、メンバー別・プロジェクト別の2ビューで可視化するダッシュボード。

## 技術構成
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Salesforce API接続: jsforce (require形式で使用)
- デプロイ: Vercel (GitHub連携による自動デプロイ)

## デプロイフロー
コード修正後:
```bash
git add <files>
git commit -m "メッセージ"
git push
```
git pushすればVercelが自動デプロイする。

## 環境変数の更新手順
`.env.local` を更新した後、以下のコマンドでVercelの環境変数を同期する:
```bash
# 既存の環境変数を削除
vercel env rm SALESFORCE_USERNAME production -y
vercel env rm SALESFORCE_PASSWORD production -y
vercel env rm SALESFORCE_SECURITY_TOKEN production -y

# 新しい値を設定（printfでパイプすること。<<<やcatパイプは値が壊れる）
printf 'ユーザー名' | vercel env add SALESFORCE_USERNAME production
printf 'パスワード' | vercel env add SALESFORCE_PASSWORD production
printf 'トークン' | vercel env add SALESFORCE_SECURITY_TOKEN production
```
**重要**: `<<<` やcatパイプで値を渡すと値が壊れるため、必ず `printf` を使うこと。

設定後、再デプロイが必要:
```bash
git commit --allow-empty -m "redeploy with updated env vars" && git push
```

## Salesforce接続情報
- 認証情報: `.env.local` に格納（gitignore済み）
- 変数名: `SALESFORCE_USERNAME`, `SALESFORCE_PASSWORD`, `SALESFORCE_SECURITY_TOKEN`
- RecordType: 見通し/実績 (012IS000000x0WqYAI)、ForecastAchievement__c = '見通し'
- Phase__c = '0' のプロジェクトは除外

## URL
- 本番: https://asign-app.vercel.app
- GitHub: https://github.com/tanigawa3/asign-app
- Vercelダッシュボード: https://vercel.com/tanigawa3s-projects/asign-app
