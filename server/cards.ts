import type { Connectors, Rotation, Spots } from "../shared/shared";

export interface Card {
  id: string;
  spots: Spots;
  connectors: Connectors;
}

export type CardId = { id: string };

export const allCards: Card[] = [
  {
    id: "000",
    spots: {
      center: "lawn",
      bottom: "street",
    },
    connectors: {
      top: "lawn",
      bottom: "street",
      left: "lawn",
      right: "lawn",
    },
  },
  {
    id: "001",
    spots: {
      center: "lawn",
    },
    connectors: {
      top: "lawn",
      bottom: "lawn",
      left: "lawn",
      right: "lawn",
    },
  },
];

export const cardsById: { [id: string]: Card } = allCards.reduce(
  (acc, card) => {
    acc[card.id] = card;
    return acc;
  },
  {} as { [id: string]: Card },
);

export function rotateCard(card: Card, delta: Rotation): Card {
  for (let i = 0; i < delta / 90; i++) {
    // TODO
  }

  return card;
}
