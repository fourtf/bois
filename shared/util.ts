import type { Card } from "../server/cards";
import { Cell, newCoordKey } from "./shared";

export function removeRandom<T>(array: T[]): T {
  return array.splice(Math.floor(Math.random() * array.length), 1)[0];
}

export function getCellsByCoordKey(cells: Cell[]): { [key: string]: Cell } {
  return cells.reduce((acc, cell) => {
    acc[newCoordKey(cell.coord)] = cell;
    return acc;
  }, {});
}

export function getCardsById(cards: Card[]): { [key: string]: Card } {
  return cards.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {});
}

export function uniqueStrings(array: string[]): string[] {
  return [...new Set(array).values()];
}

export function objectEntries<K extends string, V>(
  obj: { [key in K]?: V },
): [K, V][] {
  return Object.entries(obj) as unknown as [K, V][];
}

export function firstKey<K extends string>(obj: { [key in K]?: unknown }): K {
  return Object.keys(obj)[0] as K;
}

export function firstValue<V>(
  obj: Record<string, V>,
): V {
  return Object.values(obj)[0];
}

export function removeIf<T>(
  array: T[],
  predicate: (item: T) => boolean,
) {
  let index = array.findIndex(predicate);
  if (index >= 0) {
    array.splice(index, 1);
  }
}
