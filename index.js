#!/usr/bin/env node
import { createInterface } from "readline";
import { streamChat } from "./src/client.js";
import { startServer } from "./src/api.js";

const [, , command, ...args] = process.argv;

if (command === "serve") {
  startServer(parseInt(args[0]) || 3000);
} else if (command === "chat") {
  const message = args.join(" ").trim();
  if (message) await runChat(message);
} else if (command === "transform") {
  const topicIndex = args[0] ?? "1";
  const message = args.slice(1).join(" ").trim();
  if (message) await runChat(message, topicIndex);
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  console.log("Simeji AI チャット (AIに質問モード)\n終了: Ctrl+C\n");
  const ask = () => {
    rl.question("You: ", async (input) => {
      input = input.trim();
      if (!input) return ask();
      await runChat(input);
      ask();
    });
  };
  ask();
}

async function runChat(message, topicIndex = "") {
  process.stdout.write("Simeji AI: ");
  for await (const token of streamChat({ message, topicIndex })) process.stdout.write(token);
  process.stdout.write("\n");
}
