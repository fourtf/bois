import {
  addToCoordKey,
  CellConnection,
  ClaimPos,
  ClaimType,
  ClientMessage,
  Coordinate,
  CoordinateKey,
  newCoordKey,
  parseCoordKey,
} from "../shared/shared";
import { ifMap, maybeToArray, uniqueStrings } from "../shared/util";
import { baseSet, Card } from "./cards";
import type { ServerCell } from "./common";
import { isBoiOnCity, isBoiOnLawn, isBoiOnStreet } from "./finished-structures";
import type { ServerGame } from "./server-game";

export function processMessage(sg: ServerGame, msg: ClientMessage) {
  switch (msg.type) {
    case "start-game": {
      sg.startGame();
      return;
    }

    case "new-game": {
      sg.newGame([baseSet.cells], [...baseSet.cards]);
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
      sg.placeBoi(msg.claimPos);
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
  card: Card
): Coordinate[] {
  return getSurroundingCells(cells)
    .filter((coordKey) => {
      const leftCard = cells[addToCoordKey(coordKey, -1, 0)]?.card;
      const rightCard = cells[addToCoordKey(coordKey, 1, 0)]?.card;
      const topCard = cells[addToCoordKey(coordKey, 0, -1)]?.card;
      const bottomCard = cells[addToCoordKey(coordKey, 0, 1)]?.card;

      return (
        (leftCard === undefined ||
          getConnector(leftCard, "right") === getConnector(card, "left")) &&
        (rightCard === undefined ||
          getConnector(rightCard, "left") === getConnector(card, "right")) &&
        (topCard === undefined ||
          getConnector(topCard, "bottom") === getConnector(card, "top")) &&
        (bottomCard === undefined ||
          getConnector(bottomCard, "top") === getConnector(card, "bottom"))
      );
    })
    .map(parseCoordKey);
}

function getSurroundingCells(
  cells: Record<CoordinateKey, ServerCell>
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
      .filter((coordKey) => cells[coordKey] === undefined)
  );

  return x;
}

export function getClaimPositions(
  cells: Record<string, ServerCell>,
  coord: Coordinate
): ClaimPos[] {
  const mapCP =
    (type: ClaimType) =>
    ({ claimPos: position }): ClaimPos => ({ type, position });
  const card = cells[newCoordKey(coord)]?.card;

  return [
    ...(card.lawns
      ?.filter((lawn) => !isBoiOnLawn(cells, coord, lawn))
      ?.map(mapCP("lawn")) ?? []),
    ...(card.streets
      ?.filter((street) => !isBoiOnStreet(cells, coord, street))
      ?.map(mapCP("street")) ?? []),
    ...(card.cities
      ?.filter((city) => !isBoiOnCity(cells, coord, city))
      ?.map(mapCP("city")) ?? []),
    ...maybeToArray(ifMap(card.monastery, mapCP("monastery"))),
  ];
}

export function getConnector(card: Card, conn: CellConnection): string {
  return card.streets?.find(({ connections }) => connections.includes(conn))
    ? "street"
    : card.cities?.find(({ connections }) => connections.includes(conn))
    ? "city"
    : "lawn";
}
