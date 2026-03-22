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

## Salesforce接続の仕組み

### 認証方式
jsforce（Node.js用SFクライアントライブラリ）を使い、ユーザー名・パスワード認証でSalesforce REST APIに接続している。

```javascript
const jsforce = require("jsforce");
const conn = new jsforce.Connection({ loginUrl: "https://login.salesforce.com" });
await conn.login("ユーザー名", "パスワード" + "セキュリティトークン");

// ログイン後、SOQLでデータ取得
const result = await conn.query("SELECT Name FROM Project__c");
```

### 環境変数
認証情報は `.env.local` に格納（gitignore済み）:
- `SALESFORCE_USERNAME` - SFログインメールアドレス
- `SALESFORCE_PASSWORD` - SFログインパスワード
- `SALESFORCE_SECURITY_TOKEN` - SFセキュリティトークン（IP制限の代替認証要素）

SFパスワード変更時はセキュリティトークンもリセットされるため、両方の更新が必要。

### データ取得
- 見通しデータ: RecordType 見通し/実績 (012IS000000x0WqYAI)、ForecastAchievement__c = '見通し'
- 実績データ: RecordType 実績 (012IS000000x2B0YAI)
- Phase__c = '0' のプロジェクトは除外

## Google OAuth認証

### 概要
NextAuth.js + Google OAuthで認証。gridpredict.co.jpドメインのGoogleアカウントのみログイン可能。
APIルート（`/api/salesforce`）にもセッションチェックがあり、未認証のAPI直接アクセスも拒否される。

### Google Cloud Console設定（設定済み）
1. https://console.cloud.google.com にアクセス
2. プロジェクト「asign-app」を選択
3. 「APIとサービス」→「OAuth同意画面」: 内部アプリとして設定済み
4. 「認証情報」→ OAuthクライアント:
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みリダイレクトURI: `https://asign-app.vercel.app/api/auth/callback/google`

### 環境変数
`.env.local` およびVercelに設定:
- `GOOGLE_CLIENT_ID` - Google OAuthクライアントID
- `GOOGLE_CLIENT_SECRET` - Google OAuthクライアントシークレット
- `NEXTAUTH_URL` - `https://asign-app.vercel.app`
- `NEXTAUTH_SECRET` - セッション暗号化キー

### ドメイン制限
`src/app/api/auth/[...nextauth]/route.ts` の `signIn` コールバックで `@gridpredict.co.jp` ドメインのみ許可している。

## URL
- 本番: https://asign-app.vercel.app
- GitHub: https://github.com/tanigawa3/asign-app
- Vercelダッシュボード: https://vercel.com/tanigawa3s-projects/asign-app
