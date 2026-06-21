import express from "express";
import { chat, streamChat } from "./client.js";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, bee, topicIndex } = req.body ?? {};
  if (!message) return res.status(400).json({ error: "message is required" });
  try {
    const response = await chat({ message, bee, topicIndex });
    res.json({ message, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat/stream", async (req, res) => {
  const { message, bee, topicIndex } = req.body ?? {};
  if (!message) return res.status(400).json({ error: "message is required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    for await (const token of streamChat({ message, bee, topicIndex })) {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

export { app };

export function startServer(port = 3000) {
  app.listen(port, () => {
    console.log(`Simeji AI API running at http://localhost:${port}`);
  });
}
