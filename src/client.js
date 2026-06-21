import crypto from "crypto";
import WebSocket from "ws";
import { buildPayload } from "./crypto.js";

const WS_URL = "wss://api-us.simeji.me/gbu/rest/v1/ai_chat/simeji_streaming_openai_service";

const COMMON_PARAMS = {
  app_version: "19.4.2",
  system_version: "13",
  sdk_version: "33",
  device: "android",
  sys_lang: "ja-JP",
  country: "JP",
  model: "Pixel 7",
  referrer: "",
  channel: "gplay",
  brand: "google",
  pkg: "com.adamrocker.android.input.simeji",
  zone: "9",
};

function makeLogId() {
  return String(Date.now()) + String(Math.floor(Math.random() * 90) + 10);
}

function buildRequest({ message, bee = "0", topicIndex = "" }) {
  const timestamp = Math.floor(Date.now() / 1000);
  const logId = makeLogId();
  const md5 = crypto
    .createHash("md5")
    .update(`bee=${bee}&timestamp=${timestamp}`)
    .digest("hex");

  const req = { ...COMMON_PARAMS, bee, timestamp, md5 };

  req.keywords = JSON.stringify([message]);
  req.prompt = message;

  if (topicIndex === "") {
    req.tab_type = "qa";
    req.nlp_ext_data = JSON.stringify({ model: "gpt-3.5-turbo", url: "" });
  } else {
    req.tab_type = "aa";
  }

  req.topic_index = topicIndex;
  req.logid = logId;

  return { req, logId };
}

export async function* streamChat({ message, bee = "0", topicIndex = "" }) {
  const { req, logId } = buildRequest({ message, bee, topicIndex });
  const payload = buildPayload(req);

  const queue = [];
  let resolve = null;
  let done = false;
  let wsError = null;

  const push = (value) => {
    queue.push(value);
    if (resolve) {
      const r = resolve;
      resolve = null;
      r();
    }
  };

  const ws = new WebSocket(WS_URL, {
    headers: { "x-request-id": logId, "User-Agent": "okhttp/4.8.1" },
  });

  ws.on("open", () => ws.send(payload));

  ws.on("message", (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    const errno = msg?.errno;
    if (errno === 5) {
      done = true;
      push(null);
      ws.close();
    } else if (errno === 0) {
      const content = msg?.data?.content ?? "";
      if (content) push(content);
    }
  });

  ws.on("error", (err) => {
    wsError = err;
    done = true;
    push(null);
  });

  ws.on("close", () => {
    if (!done) { done = true; push(null); }
  });

  while (true) {
    if (queue.length === 0) {
      if (done) break;
      await new Promise((r) => (resolve = r));
      continue;
    }
    const token = queue.shift();
    if (token === null) break;
    yield token;
  }

  if (wsError) throw wsError;
}

export async function chat(opts) {
  const parts = [];
  for await (const token of streamChat(opts)) parts.push(token);
  return parts.join("");
}
