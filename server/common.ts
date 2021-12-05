import type {
  ClaimPos,
  Coordinate,
  Player,
  Rotation,
  State,
} from "../shared/shared";
import type WebSocket from "ws";
import type { Card } from "./cards";

export type ServerCell = {
  card: Card;
  coord: Coordinate;
  rotation?: Rotation;
  claimedPos?: ClaimPos;
};

export type ServerPlayer = Player & {
  ws: WebSocket;
};

export type ServerSpectator = {
  id: string;
  ws: WebSocket;
};

export function assertInState<Expected extends State["type"]>(
  s: string,
  expected: Expected
): asserts s is Expected {
  if (s !== expected) {
    throw new Error(`Expected ${s} to equal ${expected}`);
  }
}
