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
  boiSpot?: [number, number];
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
  | { type: "place-boi"; coord: Coordinate; claimPositions: ClaimPos[] }
  | { type: "game-ended" };

export type StateTypes = State["type"];

export interface Game {
  state: State;
  cells: Cell[];
  players: Player[];
  cardCount?: number;
}

export function hasGameStarted(state: State): boolean {
  return state.type !== "not-started";
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export type ClaimType = "city" | "street" | "lawn" | "monastery";
export interface ClaimPos {
  type: ClaimType;
  position: [number, number];
}

export type CellConnection = "top" | "bottom" | "left" | "right";
export type LawnConnection =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "leftTop"
  | "leftBottom"
  | "rightTop"
  | "rightBottom";
export type CityEffect = "coatOfArms" | "cathedral";
export type StreetEffect = "guesthouse";

// MESSAGES
export type ClientMessage = ClientGameMessage;

export type ClientGameMessage =
  | { type: "start-game" }
  | { type: "new-game" }
  | { type: "draw-card" }
  | { type: "play-card"; coord: Coordinate }
  | { type: "rotate-card" }
  | { type: "place-boi"; claimPosition: ClaimPos }
  | { type: "skip-placing-boi" };

export type ServerMessage = {
  type: "game-updated";
  game: Game;
};
