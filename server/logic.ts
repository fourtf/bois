import {
  addToCoordKey,
  Cell,
  ClientGameMessage,
  ClientMessage,
  Coordinate,
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
import { defaultGameData, GameData } from "./common";

export function processMessage(
  gameData: GameData,
  msg: ClientGameMessage | ClientMessage,
) {
  const { game, cardsLeft } = gameData;

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

      Object.assign(
        gameData,
        <GameData> {
          ...defaultGameData(),
          game: {
            ...defaultGameData().game,
            players: game.players,
          },
          playerData: gameData.playerData,
          spectatorData: gameData.spectatorData,
        },
      );

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
        cardRotation: 0,
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

    case "rotate-card": {
      assertInState(game.state.type, "play-card");

      const rotation = ((game.state.cardRotation + 90) % 360) as Rotation;
      const card = rotateCard(cardsById[game.state.cardId], rotation);

      game.state.cardRotation = rotation;
      game.state.coords = getPlaceablePositions(
        game.cells,
        card,
      );

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
      const rotateCard_ = (rotation: Rotation) =>
        (card: Card) => rotateCard(card, rotation);

      const leftCell = cellsByCoordKey[addToCoordKey(coordKey, -1, 0)];
      const rightCell = cellsByCoordKey[addToCoordKey(coordKey, 1, 0)];
      const topCell = cellsByCoordKey[addToCoordKey(coordKey, 0, -1)];
      const bottomCell = cellsByCoordKey[addToCoordKey(coordKey, 0, 1)];

      const leftCard = ifMap(
        cardsById[leftCell?.cardId],
        rotateCard_(leftCell?.rotation ?? 0),
      );
      const rightCard = ifMap(
        cardsById[rightCell?.cardId],
        rotateCard_(rightCell?.rotation ?? 0),
      );
      const topCard = ifMap(
        cardsById[topCell?.cardId],
        rotateCard_(topCell?.rotation ?? 0),
      );
      const bottomCard = ifMap(
        cardsById[bottomCell?.cardId],
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

export function assertInState<Expected extends State["type"]>(
  s: string,
  expected: Expected,
): asserts s is Expected {
  if (s !== expected) {
    throw new Error(`Expected ${s} to equal ${expected}`);
  }
}

function ifMap<T>(
  x: T | undefined,
  f: (x: T) => T,
): T | undefined {
  return x === undefined ? undefined : f(x);
}
