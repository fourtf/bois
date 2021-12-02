import { ClientMessage, ServerMessage, wsPort } from "../shared/shared";
import WebSocket from "ws";
import express from "express";
import { createServer } from "http";
import { processMessage } from "./logic";
import {
  addPlayerOrSpectator,
  defaultGameData,
  GameData,
  removePlayerOrSpectator,
} from "./common";

let gameData: GameData = defaultGameData();

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({
  server,
});

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  const id = addPlayerOrSpectator(gameData, ws);

  updateGame();

  ws.on("message", (message: string) => {
    console.log(`Client sent: ${message}`);

    const msg: ClientMessage = JSON.parse(message);
    try {
      processMessage(gameData, msg);
      updateGame();
    } catch (e) {
      console.log(e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    removePlayerOrSpectator(gameData, id);
    updateGame();
  });
});

server.listen(wsPort, () => {
  console.log(`Listening on port ${wsPort}`);
});

function updateGame() {
  const data: ServerMessage = {
    type: "game-updated",
    game: gameData.game,
  };

  const json = JSON.stringify(data);

  for (const id in gameData.playerData) {
    gameData.playerData[id].ws.send(json);
  }
  for (const id in gameData.spectatorData) {
    gameData.spectatorData[id].ws.send(json);
  }
}
