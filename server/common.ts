import type { ClaimedPos, Coordinate, Rotation, State } from "../shared/shared";
import type WebSocket from "ws";
import type { Card } from "./cards";

export const defaultBoiCount = 8;

export type ServerCell = {
  card: Card;
  coord: Coordinate;
  rotation?: Rotation;
  claimedPos?: ClaimedPos;
};

export type ServerPlayer = {
  id: string;
  name: string;
  score: number;
  boisLeft: number;
  isConnected: boolean;
};

export type ServerClient = {
  ws: WebSocket;
  player?: ServerPlayer;
};

export function assertInState<Expected extends State["type"]>(
  s: string,
  expected: Expected
): asserts s is Expected {
  if (s !== expected) {
    throw new Error(`Expected ${s} to equal ${expected}`);
  }
}

export function assertTrue(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error("Assertion failed");
  }
}
