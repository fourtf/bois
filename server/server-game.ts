import {
  Cell,
  ClaimPos,
  Coordinate,
  CoordinateKey,
  Game,
  hasGameStarted,
  newCoordKey,
  Player,
  Rotation,
  State,
  STATUS_STOP_RECONNECTING,
} from "../shared/shared";
import { v4 as uuidv4 } from "uuid";
import type WebSocket from "ws";
import { allCards, Card, getClaimPositions, rotateCard } from "./cards";
import { removeIf, removeRandom } from "../shared/util";
import { getPlaceablePositions } from "./logic";
import {
  assertInState,
  ServerCell,
  ServerPlayer,
  ServerClient,
  defaultBoiCount,
} from "./common";
import { checkFinishedStructures } from "./finished-structures";

export class ServerGame {
  cells: Record<CoordinateKey, ServerCell> = {};
  state: State = { type: "not-started" };
  players: ServerPlayer[] = [];
  clients: ServerClient[] = [];
  cardsLeft: Card[] = [];
  cardToPlay?: Card;
  currentPlayerIndex: number = 0;

  newGame(cells: ServerCell[], cards: Card[]) {
    if (this.cells.length) {
      assertInState(this.state.type, "game-ended");
    }

    this.cells = cells.reduce((cells, { card, coord, rotation }) => {
      const cell = { card, coord, rotation };
      cells[newCoordKey(coord)] = cell;
      return cells;
    }, {} as Record<CoordinateKey, ServerCell>);
    this.cardsLeft = [...cards];
    this.state = { type: "not-started" };
  }

  startGame() {
    assertInState(this.state.type, "not-started");
    this.currentPlayerIndex = 0;
    this.players.forEach((p) => {
      p.score = 0;
      p.boisLeft = defaultBoiCount;
    });
    this.state = { type: "draw-card" };
  }

  drawCard() {
    assertInState(this.state.type, "draw-card");

    const card = removeRandom(this.cardsLeft);
    if (card === undefined) {
      throw new Error("No card to draw");
    }

    this.cardToPlay = card;
    this.state = {
      type: "play-card",
      cardId: card.id,
      cardRotation: 0,
      coords: getPlaceablePositions(this.cells, card),
    };
  }

  playCard(coord: Coordinate) {
    assertInState(this.state.type, "play-card");
    const card = this.cardToPlay ?? allCards[0];

    if (!this.state.coords.find((c) => c.x === coord.x && c.y === coord.y)) {
      throw new Error("Invalid coordinate");
    }

    this.cells[newCoordKey(coord)] = {
      card,
      coord,
      rotation: this.state.cardRotation,
    };
    this.state = {
      type: "place-boi",
      coord,
      claimPositions: getClaimPositions(this.cardToPlay),
      rotation: this.state.cardRotation,
    };
    this.cardToPlay = undefined;
  }

  rotateCard() {
    assertInState(this.state.type, "play-card");

    const rotation = ((this.state.cardRotation + 90) % 360) as Rotation;
    const card = rotateCard(this.cardToPlay ?? allCards[0], 90);

    this.state.cardRotation = rotation;
    this.state.coords = getPlaceablePositions(this.cells, card);
    this.cardToPlay = card;
  }

  placeBoi(pos: ClaimPos) {
    assertInState(this.state.type, "place-boi");

    if (!this.currentPlayer?.boisLeft) {
      throw new Error("No bois left");
    }

    this.currentPlayer.boisLeft--;

    let cell = this.cells[newCoordKey(this.state.coord)];
    if (cell) {
      cell.claimedPos = { ...pos, playerId: this.currentPlayer.id };
    }

    this.endTurn();
  }

  endTurn() {
    assertInState(this.state.type, "place-boi");

    // points
    const { pointsGainedPerPlayer, regainedBoisPerPlayer } =
      checkFinishedStructures(this.cells, this.state.coord);

    addPointsToScores(this.players, pointsGainedPerPlayer);
    addRegainedBois(this.players, regainedBoisPerPlayer);

    // next state
    if (this.cardsLeft.length === 0) {
      this.state = { type: "game-ended" };
    } else {
      this.state = { type: "draw-card" };
    }

    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  get currentPlayer(): ServerPlayer | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  get host(): ServerPlayer | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  /**
   * @returns id of the added player/spectator
   */
  addClient(ws: WebSocket) {
    this.clients.push({ ws });
  }

  removeClient(ws: WebSocket) {
    removeIf(this.clients, (c) => c.ws === ws);

    // player
    if (hasGameStarted(this.state)) {
      const player = this.players.find(({ ws: playerWs }) => playerWs === ws);
      if (player) {
        player.isConnected = false;
      }
    } else {
      removeIf(this.players, ({ ws: playerWs }) => playerWs === ws);
    }
  }

  joinGame(ws: WebSocket): string {
    if (!hasGameStarted(this.state)) {
      const id = uuidv4();
      const client = this.clients.find((s) => s.ws === ws);
      if (client) {
        const player: ServerPlayer = {
          id,
          ws: client.ws,
          isConnected: true,
          score: 0,
          boisLeft: 0,
          name: "player-" + id.slice(0, 4),
        };
        this.players.push(player);
        return id;
      }

      throw new Error("Client not found");
    }

    throw new Error("Game already started");
  }

  rejoinGame(ws: WebSocket, id: string): boolean {
    const player = this.players.find((p) => p.id === id);

    if (player) {
      player.ws.close(STATUS_STOP_RECONNECTING);
      player.ws = ws;
      player.isConnected = true;
      return true;
    }

    return false;
  }

  leaveGame(ws: WebSocket) {
    if (!hasGameStarted(this.state)) {
      removeIf(this.players, ({ ws: playerWs }) => playerWs === ws);
    }
  }
}

export function liftServerGame(sg: ServerGame): Game {
  return {
    state: sg.state,
    cells: Object.values(sg.cells).map(
      ({ card, coord, rotation, claimedPos: claimPos }): Cell => ({
        cardId: card.id,
        coord,
        rotation,
        claimPos,
      })
    ),
    players: sg.players.map(
      ({ id, name, score, boisLeft, isConnected }): Player => ({
        id,
        name,
        score,
        isConnected,
        boisLeft,
        isHost: sg.host.id === id,
        isTheirTurn:
          sg.currentPlayerIndex === sg.players.findIndex((p) => p.id === id),
      })
    ),
    cardCount: sg.cardsLeft.length,
    spectatorCount:
      sg.clients.length - sg.players.filter((x) => x.isConnected).length,
  };
}

function addPointsToScores(
  players: ServerPlayer[],
  pointsPerPlayer: Map<string, number>
) {
  for (const [playerId, points] of pointsPerPlayer.entries()) {
    const player = players.find((p) => p.id === playerId);

    if (player) {
      player.score += points;
    }
  }
}

function addRegainedBois(
  players: ServerPlayer[],
  regainedBoisPerPlayer: Map<string, number>
) {
  for (const [playerId, bois] of regainedBoisPerPlayer.entries()) {
    const player = players.find((p) => p.id === playerId);

    if (player) {
      player.boisLeft += bois;
    }
  }
}
