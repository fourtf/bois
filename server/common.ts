import type {
  ClaimPos,
  Coordinate,
  Player,
  Rotation,
  State,
} from "../shared/shared";
import type WebSocket from "ws";
import type { Card } from "./cards";

export const defaultBoiCount = 8;

export type ServerCell = {
  card: Card;
  coord: Coordinate;
  rotation?: Rotation;
  claimPos?: ClaimPos;
};

export type ServerPlayer = {
  id: string;
  name: string;
  score: number;
  boisLeft: number;
  isConnected: boolean;
  ws: WebSocket;
};

export type ServerClient = {
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
