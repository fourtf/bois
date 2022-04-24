import { Cell, Game, Player, STATUS_STOP_RECONNECTING } from "../shared/shared";
import type WebSocket from "ws";
import type { ServerClient } from "./common";
import { ServerGame } from "./server-game";

export class ServerLobby {
  clients: Map<WebSocket, ServerClient> = new Map();
  game: ServerGame = new ServerGame();

  addClient(ws: WebSocket) {
    this.clients.set(ws, { ws });
  }

  removeClient(ws: WebSocket) {
    const player = this.clients.get(ws)?.player;

    if (player) {
      this.game.removePlayer(player);
    }

    this.clients.delete(ws);
  }

  joinGame(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (client === undefined) throw new Error("Client not found");

    const player = client.player;
    if (player !== undefined) throw Error("Player already joined");

    client.player = this.game.addPlayer();
  }

  rejoinGame(ws: WebSocket, id: string): boolean {
    const client = this.clients.get(ws);
    if (client === undefined) throw new Error("Client not found");

    for (const client of this.clients.values()) {
      if (client.player?.id === id) {
        // mark player as "connected"
        this.game.reconnectPlayer(client.player);

        // disconnect old ws
        client.ws.close(STATUS_STOP_RECONNECTING);

        // connect new ws
        client.ws = ws;

        return true;
      }
    }

    return false;
  }

  leaveGame(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (client === undefined) throw new Error("Client not found");

    const player = client.player;
    if (player === undefined) throw Error("Player not joined");

    this.game.removePlayer(player);
  }

  toClientGame(): Game {
    const { state, cells, players, host, cardsLeft } = this.game;

    return {
      state,
      cells: Object.values(cells).map(
        ({ card, coord, rotation, claimedPos: claimPos }): Cell => ({
          cardId: card.id,
          coord,
          rotation,
          claimPos,
        })
      ),
      players: players.map(
        ({ id, name, score, boisLeft, isConnected }): Player => ({
          id,
          name,
          score,
          isConnected,
          boisLeft,
          isHost: host?.id === id,
          isTheirTurn: arguments[0] === this.game.currentPlayer,
        })
      ),
      cardCount: cardsLeft.length,
      spectatorCount:
        this.clients.size - players.filter((x) => x.isConnected).length,
    };
  }
}
