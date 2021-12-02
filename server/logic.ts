import {
  addToCoordKey,
  Cell,
  ClientGameMessage,
  ClientMessage,
  Coordinate,
  newCoordKey,
  parseCoordKey,
  State,
} from "../shared/shared";
import {
  getCardsById,
  getCellsByCoordKey,
  removeRandom,
  uniqueStrings,
} from "../shared/util";
import { allCards, Card, cardsById } from "./cards";
import type { GameData } from "./common";

export function processMessage(
  { game, cardsLeft }: GameData,
  msg: ClientGameMessage | ClientMessage,
) {
  function endTurn() {
    if (cardsLeft.length === 0) {
      game.state = { type: "game-ended" };
    } else {
      game.state = { type: "draw-card" };
    }
  }

  switch (msg.type) {
    case "start-game": {
      assertInState(game.state.type, "not-started");
      game.state = { type: "draw-card" };
      return;
    }

    case "new-game": {
      assertInState(game.state.type, "game-ended");
      game.state = { type: "not-started" };
      return;
    }

    case "draw-card": {
      assertInState(game.state.type, "draw-card");

      const cardId = removeRandom(cardsLeft).id;
      const card = cardsById[cardId];
      if (card === undefined) {
        throw new Error("Card not found");
      }

      game.state = {
        type: "play-card",
        cardId,
        coords: getPlaceablePositions(game.cells, card),
      };
      game.cardCount = cardsLeft.length;

      return;
    }
    case "play-card": {
      assertInState(game.state.type, "play-card");

      const coord = msg.coord;
      game.cells.push({
        cardId: game.state.cardId,
        coord,
      });

      game.state = {
        type: "place-boi",
        coord,
        spots: cardsById[game.state.cardId].spots,
      };

      return;
    }
    case "place-boi": {
      assertInState(game.state.type, "place-boi");
      const coord = game.state.coord;
      const spot = msg.spot;

      let cell = game.cells.find((cell) =>
        cell.coord.x === coord.x &&
        cell.coord.y === coord.y
      );
      if (cell) {
        cell.boiSpot = spot;
      }

      endTurn();
      return;
    }
    case "skip-placing-boi": {
      assertInState(game.state.type, "place-boi");

      endTurn();
      return;
    }
    default: {
      throw new Error("Unknown message type");
    }
  }
}

export function getPlaceablePositions(
  cells: Cell[],
  card: Card,
  test_allCards?: Card[],
): Coordinate[] {
  const cellsByCoordKey = getCellsByCoordKey(cells);
  const cardsById = getCardsById(test_allCards ?? allCards);

  // unique list of all coordinates that are not already occupied and where a
  // card could be placed on
  const coordKeys = uniqueStrings(
    cells
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
      .map(([x, y]) => newCoordKey(x, y)),
  );

  return coordKeys.filter((coordKey) => cellsByCoordKey[coordKey] === undefined)
    .filter((coordKey) => {
      const leftCard =
        cardsById[cellsByCoordKey[addToCoordKey(coordKey, -1, 0)]?.cardId];
      const rightCard =
        cardsById[cellsByCoordKey[addToCoordKey(coordKey, +1, 0)]?.cardId];
      const upCard =
        cardsById[cellsByCoordKey[addToCoordKey(coordKey, 0, -1)]?.cardId];
      const downCard =
        cardsById[cellsByCoordKey[addToCoordKey(coordKey, 0, +1)]?.cardId];

      return (
        (leftCard === undefined ||
          leftCard.connectors.right === card.connectors.left) &&
        (rightCard === undefined ||
          rightCard.connectors.left === card.connectors.right) &&
        (upCard === undefined ||
          upCard.connectors.bottom === card.connectors.top) &&
        (downCard === undefined ||
          downCard.connectors.top === card.connectors.bottom)
      );
    })
    .map(parseCoordKey);
}

export function assertInState<Expected extends State["type"]>(
  s: string,
  expected: Expected,
): asserts s is Expected {
  if (s !== expected) {
    throw new Error(`Expected ${s} to equal ${expected}`);
  }
}
