import {
  addToCoordKey,
  Cell,
  ClientGameMessage,
  ClientMessage,
  Coordinate,
  CoordinateKey,
  newCoordKey,
  parseCoordKey,
  Rotation,
  State,
} from "../shared/shared";
import {
  getCardsById,
  getCellsByCoordKey,
  removeRandom,
  uniqueStrings,
} from "../shared/util";
import { allCards, Card, cardsById, rotateCard } from "./cards";
import type { ServerCell } from "./common";
import type { ServerGame } from "./server-game";

export function processMessage(
  sg: ServerGame,
  msg: ClientGameMessage | ClientMessage,
) {
  switch (msg.type) {
    case "start-game": {
      sg.startGame();
      return;
    }

    case "new-game": {
      sg.newGame([], [allCards[0], allCards[0], allCards[1]]);
      return;
    }

    case "draw-card": {
      sg.drawCard();
      return;
    }

    case "play-card": {
      sg.playCard(msg.coord);
      return;
    }

    case "rotate-card": {
      sg.rotateCard();
      return;
    }

    case "place-boi": {
      sg.placeBoi(msg.spot);
      return;
    }

    case "skip-placing-boi": {
      sg.endTurn();
      return;
    }

    default: {
      throw new Error("Unknown message type");
    }
  }
}

export function getPlaceablePositions(
  cells: Record<CoordinateKey, ServerCell>,
  card: Card,
): Coordinate[] {
  return getSurroundingCells(cells)
    .filter((coordKey) => {
      const rotateCard_ = (rotation: Rotation) =>
        (card: Card) => rotateCard(card, rotation);

      const leftCell = cells[addToCoordKey(coordKey, -1, 0)];
      const rightCell = cells[addToCoordKey(coordKey, 1, 0)];
      const topCell = cells[addToCoordKey(coordKey, 0, -1)];
      const bottomCell = cells[addToCoordKey(coordKey, 0, 1)];

      const leftCard = ifMap(
        leftCell?.card,
        rotateCard_(leftCell?.rotation ?? 0),
      );
      const rightCard = ifMap(
        rightCell?.card,
        rotateCard_(rightCell?.rotation ?? 0),
      );
      const topCard = ifMap(
        topCell?.card,
        rotateCard_(topCell?.rotation ?? 0),
      );
      const bottomCard = ifMap(
        bottomCell?.card,
        rotateCard_(bottomCell?.rotation ?? 0),
      );

      return (
        (leftCard === undefined ||
          leftCard.connectors.right === card.connectors.left) &&
        (rightCard === undefined ||
          rightCard.connectors.left === card.connectors.right) &&
        (topCard === undefined ||
          topCard.connectors.bottom === card.connectors.top) &&
        (bottomCard === undefined ||
          bottomCard.connectors.top === card.connectors.bottom)
      );
    })
    .map(parseCoordKey);
}

function getSurroundingCells(
  cells: Record<CoordinateKey, ServerCell>,
): CoordinateKey[] {
  let x = uniqueStrings(
    Object.values(cells)
      .map((card) => {
        const { x, y } = card.coord;

        return [
          [x - 1, y],
          [x + 1, y],
          [x, y - 1],
          [x, y + 1],
        ];
      })
      .flat()
      .map(([x, y]) => newCoordKey(x, y))
      .filter((coordKey) => cells[coordKey] === undefined),
  );

  return x;
}

function ifMap<T>(
  x: T | undefined,
  f: (x: T) => T,
): T | undefined {
  return x === undefined ? undefined : f(x);
}
