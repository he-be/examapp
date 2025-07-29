// Cloudflare Workers サンプルアプリケーション

export const sampleData = ['Hello', 'World', 'AI', 'Driven', 'Development'];

export function getRandomItem(): string {
  const randomIndex = Math.floor(Math.random() * sampleData.length);
  return sampleData[randomIndex];
}

function generateHTML(message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${message}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }
        .container {
            text-align: center;
            background: white;
            padding: 50px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
        }
        .message {
            font-size: 24px;
            font-weight: bold;
            color: #007acc;
            margin: 20px 0;
            padding: 20px;
            border: 2px solid #007acc;
            border-radius: 10px;
        }
        .reload-button {
            background-color: #007acc;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            margin-top: 20px;
            display: inline-block;
        }
        .reload-button:hover {
            background-color: #005999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI-Driven Development Sample</h1>
        <div class="message">${message}</div>
        <a href="/" class="reload-button">Generate New</a>
    </div>
</body>
</html>
  `;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ルートパスの処理
    if (url.pathname === '/') {
      const message = getRandomItem();
      const html = generateHTML(message);

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // APIエンドポイント（JSON）
    if (url.pathname === '/api/random') {
      const message = getRandomItem();

      return new Response(JSON.stringify({ message }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 404 Not Found
    return new Response('Not Found', { status: 404 });
  },
};
