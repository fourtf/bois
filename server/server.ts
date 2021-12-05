import { ClientMessage, ServerMessage, wsPort } from "../shared/shared";
import WebSocket from "ws";
import express from "express";
import { createServer } from "http";
import { processMessage } from "./logic";
import { liftServerGame, ServerGame } from "./server-game";
import { baseSet } from "./cards";

let sg = new ServerGame();
sg.newGame([baseSet.cells], [...baseSet.cards]);

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({
  server,
});

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  sg.addClient(ws);

  updateGame();

  ws.on("message", (message: string) => {
    console.log(`Client sent: ${message}`);

    try {
      const msg: ClientMessage = JSON.parse(message);
      switch (msg.type) {
        case "join-game":
          const id = sg.joinGame(ws);

          ws.send(
            JSON.stringify(<ServerMessage>{
              type: "client-updated",
              playerId: id,
            })
          );
          break;
        case "leave-game":
          sg.leaveGame(ws);
          break;
        case "try-rejoin-game":
          if (sg.rejoinGame(ws, msg.id)) {
            ws.send(
              JSON.stringify(<ServerMessage>{
                type: "client-updated",
                playerId: msg.id,
              })
            );
          }
          break;
        default:
          if (sg.currentPlayer.ws === ws) {
            processMessage(sg, msg);
          }
      }
      updateGame();
    } catch (e) {
      console.log(e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    sg.removeClient(ws);
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

  for (const { ws } of sg.clients) {
    ws.send(json);
  }
}
