import { ClientMessage, ServerMessage, wsPort } from "../shared/shared";
import WebSocket from "ws";
import express from "express";
import { createServer } from "http";
import { processMessage } from "./logic";
import { liftServerGame, ServerGame } from "./server-game";

let sg = new ServerGame();

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({
  server,
});

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  const id = sg.addPlayerOrSpectator(ws);

  updateGame();

  ws.on("message", (message: string) => {
    console.log(`Client sent: ${message}`);

    const msg: ClientMessage = JSON.parse(message);
    try {
      processMessage(sg, msg);
      updateGame();
    } catch (e) {
      console.log(e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    sg.removePlayerOrSpectator(id);
    updateGame();
  });
});

server.listen(wsPort, () => {
  console.log(`Listening on port ${wsPort}`);
});

function updateGame() {
  const data: ServerMessage = {
    type: "game-updated",
    game: liftServerGame(sg),
  };

  const json = JSON.stringify(data);

  for (const { ws } of sg.players) {
    ws.send(json);
  }

  for (const { ws } of sg.spectators) {
    ws.send(json);
  }
}
