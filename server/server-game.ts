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
import { allCards, Card, defaultCard, rotateCard } from "./cards";
import { removeFromArray, removeIf, removeRandom } from "../shared/util";
import { getPlaceablePositions } from "./logic";
import {
  assertInState,
  ServerCell,
  ServerPlayer,
  ServerClient,
  defaultBoiCount,
  assertTrue,
} from "./common";
import {
  checkFinishedStructures,
  getClaimPositions,
} from "./structures/algorithms";

export class ServerGame {
  players: ServerPlayer[] = [];
  cells: Record<CoordinateKey, ServerCell> = {};
  state: State = { type: "not-started" };

  cardsLeft: Card[] = [];
  cardToPlay?: Card;
  currentPlayerIndex: number = 0;

  get currentPlayer(): ServerPlayer | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  get host(): ServerPlayer | null {
    return this.players[this.currentPlayerIndex] ?? null;
  }

  get hasGameStarted() {
    return hasGameStarted(this.state);
  }

  addPlayer(): ServerPlayer {
    if (this.hasGameStarted) throw new Error("Game already started");

    const id = uuidv4();
    const player: ServerPlayer = {
      id,
      isConnected: true,
      score: 0,
      boisLeft: 0,
      name: "player-" + id.slice(0, 4),
    };
    this.players.push(player);
    return player;
  }

  reconnectPlayer(player: ServerPlayer) {
    assertTrue(this.players.find((p) => p == player) !== undefined);

    player.isConnected = true;
  }

  removePlayer(player: ServerPlayer) {
    assertTrue(this.players.find((p) => p == player) !== undefined);

    if (this.hasGameStarted) {
      player.isConnected = false;
    } else {
      removeFromArray(this.players, player);
    }
  }

  /*
   * State transitions
   */

  newGame(cells: ServerCell[], cards: Card[]) {
    if (this.cardsLeft.length) {
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
    const card = this.cardToPlay ?? defaultCard;

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
      claimPositions: getClaimPositions(this.cells, coord),
      rotation: this.state.cardRotation,
    };
    this.cardToPlay = undefined;
  }

  rotateCard() {
    assertInState(this.state.type, "play-card");

    const rotation = ((this.state.cardRotation + 90) % 360) as Rotation;
    const card = rotateCard(this.cardToPlay ?? defaultCard, 90);

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
      this.#endGame();
    } else {
      this.state = { type: "draw-card" };
    }

    this.currentPlayerIndex =
      (this.currentPlayerIndex + 1) % this.players.length;
  }

  #endGame() {
    // lawns
    // unfinished roads
    // unfinished cities
  }
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
