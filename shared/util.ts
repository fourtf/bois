import type { Card } from "../server/cards";
import { Cell, newCoordKey } from "./shared";

export function removeRandom<T>(array: T[]): T | undefined {
  return array.splice(Math.floor(Math.random() * array.length), 1)[0];
}

export function getCellsByCoordKey(cells: Cell[]): Record<string, Cell> {
  return cells.reduce((acc, cell) => {
    acc[newCoordKey(cell.coord)] = cell;
    return acc;
  }, {} as Record<string, Cell>);
}

export function getCardsById(cards: Card[]): Record<string, Card> {
  return cards.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {} as Record<string, Card>);
}

export function uniqueStrings(array: string[]): string[] {
  return [...new Set(array).values()];
}

export function objectEntries<K extends string, V>(obj: { [key in K]?: V }): [
  K,
  V
][] {
  return Object.entries(obj) as unknown as [K, V][];
}

export function firstKey<K extends string>(obj: { [key in K]?: unknown }): K {
  return Object.keys(obj)[0] as K;
}

export function ifMap<T, U>(x: T | undefined, f: (x: T) => U): U | undefined {
  return x === undefined ? undefined : f(x);
}

export function maybeToArray<T>(x: T | undefined): T[] {
  return x === undefined ? [] : [x];
}

export function removeIf<T>(array: T[], predicate: (item: T) => boolean) {
  let index = array.findIndex(predicate);
  if (index >= 0) {
    array.splice(index, 1);
  }
}

export function removeFromArray<T>(array: T[], item: T) {
  removeIf(array, (x) => x === item);
}

export function repeat<T>(t: T, count: number): T[] {
  return Array.from({ length: count }, () => t);
}

// TODO remove me if possible
export function posEquals(a: [number, number], b: [number, number]): boolean {
  if (a === undefined) {
    debugger;
  }

  return a[0] === b[0] && a[1] === b[1];
}
