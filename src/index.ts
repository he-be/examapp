// src/index.ts

// 環境変数などの型定義（必要に応じて）
export interface Env {
  // 例：フィードバック送信用のAPIキーなど
  // SENDGRID_API_KEY?: string;
  [key: string]: unknown;
}

export default {
  /**
   * Workerのエントリーポイント。すべてのリクエストがこの関数を通過する。
   * ただし、リクエストが[assets]で設定された静的ファイルに一致する場合、
   * Cloudflareランタイムがこのfetchハンドラを呼び出す前にレスポンスを返す。
   * したがって、このコードは主にAPIエンドポイントのような動的リクエストを処理するために存在する。
   */
  async fetch(request: Request, _env: Env, _ctx: unknown): Promise<Response> {
    const url = new URL(request.url);

    // APIルート: /api/feedback へのPOSTリクエストのみを処理
    if (url.pathname === '/api/feedback' && request.method === 'POST') {
      try {
        // リクエストボディをJSONとしてパース
        const feedbackData: Record<string, unknown> = await request.json();
        
        // ここで外部サービス（例: SendGrid, Slack API）にフィードバックを送信するロジックを実装
        // await sendFeedbackToExternalService(feedbackData, env);

        console.log('Feedback received:', feedbackData);

        // 成功レスポンスを返す
        const responseBody = JSON.stringify({ success: true, message: "Feedback received." });
        return new Response(responseBody, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        // JSONのパース失敗など、リクエストに問題があった場合
        if (error instanceof SyntaxError) {
          return new Response('Invalid JSON in request body.', { status: 400 });
        }
        // その他のサーバーサイドエラー
        console.error('Error processing feedback:', error);
        return new Response('An internal error occurred.', { status: 500 });
      }
    }

    // ヘルスチェックエンドポイント
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: Date.now() 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // このハンドラに到達したということは、リクエストが静的アセットにも
    // 上記のAPIルートにも一致しなかったことを意味する。
    // SPA設定が有効なため、通常はナビゲーションリクエストはここに到達しないが、
    // 不明なAPIエンドポイントへのアクセスなどのためにフォールバックを用意する。
    return new Response('Not Found', { status: 404 });
  },
};