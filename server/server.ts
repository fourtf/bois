import { ClientMessage, ServerMessage, wsPort } from "../shared/shared";
import WebSocket from "ws";
import express from "express";
import { createServer } from "http";
import { processMessage } from "./logic";
import { ServerLobby } from "./server-lobby";
import { baseSet } from "./cards";

let lobby = new ServerLobby();
lobby.game.newGame([baseSet.cells], [...baseSet.cards]);

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({
  server,
});

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");

  lobby.addClient(ws);

  updateGame();

  ws.on("message", (message: string) => {
    console.log(`Client sent: ${message}`);

    try {
      const msg: ClientMessage = JSON.parse(message);
      switch (msg.type) {
        case "join-game":
          const id = lobby.joinGame(ws);

          ws.send(
            JSON.stringify(<ServerMessage>{
              type: "client-updated",
              playerId: id,
            })
          );
          break;
        case "leave-game":
          lobby.leaveGame(ws);
          break;
        case "try-rejoin-game":
          if (lobby.rejoinGame(ws, msg.id)) {
            ws.send(
              JSON.stringify(<ServerMessage>{
                type: "client-updated",
                playerId: msg.id,
              })
            );
          }
          break;
        default:
          if (lobby.clients.get(ws)?.player === lobby.game.currentPlayer) {
            processMessage(lobby.game, msg);
          }
      }
      updateGame();
    } catch (e) {
      console.log(e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    lobby.removeClient(ws);
    updateGame();
  });
});

server.listen(wsPort, () => {
  console.log(`Listening on port ${wsPort}`);
});

function updateGame() {
  const data: ServerMessage = {
    type: "game-updated",
    game: lobby.toClientGame(),
  };

  const json = JSON.stringify(data);

  for (const { ws } of lobby.clients.values()) {
    ws.send(json);
  }
}
