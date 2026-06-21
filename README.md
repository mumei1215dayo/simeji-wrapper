# simeji-ai

Simeji の AI 機能を非公式に叩くやつ。
あのキーボードの右上についてるあいつを非公式で叩くやつ
ちなみにgpt 3.5 turbo

## セットアップ

```bash
npm install
```

## 使い方

### CLI

```bash
# チャット（インタラクティブ）
node index.js

# 1回だけ
node index.js chat こんにちは！

# テキスト変換
node index.js transform 1 ちょっと待って   # 敬語
node index.js transform 2 おはよう         # 英語
node index.js transform 3 お疲れ様         # ビジネス
```

### API サーバー

```bash
node index.js serve        # localhost:3000
node index.js serve 8080
```

```bash
# チャット
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "こんにちは！"}'

# ストリーミング (SSE)
curl -X POST http://localhost:3000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "こんにちは！"}'

# テキスト変換（topicIndex を指定）
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "ちょっと待って", "topicIndex": "1"}'
```

### モジュール

## プロトコルメモ

WebSocket `wss://api-us.simeji.me/gbu/rest/v1/ai_chat/simeji_streaming_openai_service` にペイロードを投げる。

ペイロードは `base64({"data": base64(AES(params)), "key": base64(RSA(base64(AES_key)))})` の形式。

リクエストパラメータ（モード別）：

| フィールド | チャット (`topicIndex=""`) | テキスト変換 (`topicIndex="1"` 等) |
|---|---|---|
| `tab_type` | `"qa"` | `"aa"` |
| `topic_index` | `""` | `"1"` / `"2"` / `"3"` |
| `prompt` | メッセージ本文 | メッセージ本文 |
| `keywords` | `["メッセージ本文"]` | `["メッセージ本文"]` |
| `nlp_ext_data` | `{"model":"gpt-3.5-turbo","url":""}` | なし |

`topicIndex` の値は getTabV3 API のテーマ ID に対応。`1` = ゆる敬語、`2` = ラブラブ など（サーバー設定次第）。

暗号化：
- AES-128-CBC、IV = AES キー、ゼロパディング
- RSA は `base64(AES_key)` を暗号化（生のキーバイト列ではない）
- `md5` フィールド = `md5("bee=<uid>&timestamp=<unix秒>")`

```js
import { chat, streamChat } from "./src/client.js";

const reply = await chat({ message: "こんにちは！" });

for await (const token of streamChat({ message: "こんにちは！" })) {
  process.stdout.write(token);
}
```
