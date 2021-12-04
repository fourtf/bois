import type { Coordinate, CoordinateKey } from "./coordinate";

export * from "./coordinate";

// CONFIG
export const wsPort = 3000;
export const wsUrl = `ws://localhost:${wsPort}`;

// MODEL
export interface Cell {
  cardId: string;
  coord: Coordinate;
  rotation?: Rotation;
  boiSpot?: SpotPosition;
}

export type Point = { x: number; y: number };
export type Rotation = 0 | 90 | 180 | 270;

export type State =
  | { type: "not-started" }
  | { type: "draw-card" }
  | {
    type: "play-card";
    cardId: string;
    cardRotation: Rotation;
    coords: Coordinate[];
  }
  | { type: "place-boi"; coord: Coordinate; spots: Spots }
  | { type: "game-ended" };

export type StateTypes = State["type"];

export interface Game {
  state: State;
  cells: Cell[];
  players: Player[];
  cardCount?: number;
}

export function hasGameStarted(game: Game): boolean {
  return game.state.type !== "not-started";
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

// Spot in a cell where a boi can be placed
export type SpotPosition = "top" | "bottom" | "left" | "right" | "center";
export type SpotType = "street" | "lawn" | "special";
export type Spots = { [key in SpotPosition]?: SpotType };

// A connection between two cells. E.g. a street at the top of a cell
export type ConnectorSide = "top" | "bottom" | "left" | "right";
export type ConnectorType = "street" | "lawn" | "special";
export type Connectors = { [key in ConnectorSide]: ConnectorType };

// MESSAGES
export type ClientMessage = ClientGameMessage;

export type ClientGameMessage =
  | { type: "start-game" }
  | { type: "new-game" }
  | { type: "draw-card" }
  | { type: "play-card"; coord: Coordinate }
  | { type: "rotate-card" }
  | { type: "place-boi"; spot: SpotPosition }
  | { type: "skip-placing-boi" };

export type ServerMessage = {
  type: "game-updated";
  game: Game;
};
