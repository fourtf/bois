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
  ServerSpectator,
} from "./common";

export class ServerGame {
  cells: Record<CoordinateKey, ServerCell> = {};
  state: State = { type: "not-started" };
  players: ServerPlayer[] = [];
  spectators: ServerSpectator[] = [];
  cardsLeft: Card[] = [];
  cardToPlay?: Card;

  startGame() {
    assertInState(this.state.type, "not-started");
    this.state = { type: "draw-card" };
  }

  newGame(cells: ServerCell[], cards: Card[]) {
    if (this.cells.length) {
      assertInState(this.state.type, "game-ended");
    }

    this.cells = cells.reduce((cells, { card, coord, rotation }) => {
      const cell = { card, coord, rotation };
      cells[newCoordKey(coord)] = cell;
      return cells;
    }, {} as Record<CoordinateKey, ServerCell>);
    this.cardsLeft = cards;
    this.state = { type: "not-started" };
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

    this.cells[newCoordKey(coord)] = {
      card,
      coord,
      rotation: this.state.cardRotation,
    };
    this.state = {
      type: "place-boi",
      coord,
      claimPositions: getClaimPositions(this.cardToPlay),
    };
    this.cardToPlay = undefined;
  }

  rotateCard() {
    assertInState(this.state.type, "play-card");

    const rotation = ((this.state.cardRotation + 90) % 360) as Rotation;
    const card = rotateCard(this.cardToPlay ?? allCards[0], rotation);

    this.state.cardRotation = rotation;
    this.state.coords = getPlaceablePositions(this.cells, card);
    this.cardToPlay = card;
  }

  placeBoi(pos: ClaimPos) {
    assertInState(this.state.type, "place-boi");

    let cell = this.cells[newCoordKey(this.state.coord)];
    if (cell) {
      cell.claimedPos = pos;
    }

    this.endTurn();
  }

  endTurn() {
    assertInState(this.state.type, "place-boi");

    if (this.cardsLeft.length === 0) {
      this.state = { type: "game-ended" };
    } else {
      this.state = { type: "draw-card" };
    }
  }

  /**
   * @returns id of the added player/spectator
   */
  addPlayerOrSpectator(ws: WebSocket): string {
    const id = uuidv4();

    if (hasGameStarted(this.state)) {
      this.players.push({ id, ws, name: "player" + id.substr(0, 6), score: 0 });
    } else {
      this.spectators.push({ id, ws });
    }

    return id;
  }

  removePlayerOrSpectator(id: string) {
    removeIf(this.players, ({ id: playerId }) => playerId === id);
    removeIf(this.spectators, ({ id: spectatorId }) => spectatorId === id);
  }
}

export function liftServerGame(sg: ServerGame): Game {
  return {
    state: sg.state,
    cells: Object.values(sg.cells).map(
      ({ card, coord, rotation }): Cell => ({
        cardId: card.id,
        coord,
        rotation,
        // TODO: boiSpot
      })
    ),
    players: sg.players.map(
      ({ id, name, score }): Player => ({
        id,
        name,
        score,
      })
    ),
    cardCount: sg.cardsLeft.length,
  };
}
