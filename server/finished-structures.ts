import {
  addToCoordKey,
  Cell,
  CellConnection,
  Coordinate,
  CoordinateKey,
  newCoordKey,
} from "../shared/shared";
import type { ServerCell } from "./common";

/**
 * @returns points per user gained
 */
export function checkFinishedStructures(
  cells: Record<CoordinateKey, ServerCell>,
  coord: Coordinate
): {
  regainedBoisPerPlayer: Map<string, number>;
  pointsGainedPerPlayer: Map<string, number>;
} {
  // monastery: check for all monasteries around
  // street: walk all streets
  // city: walk all cities

  const coordKey = newCoordKey(coord);
  const regainedBoisPerPlayer = new Map<string, number>();
  const pointsGainedPerPlayer = new Map<string, number>();

  const { streets, cities, monastery } =
    cells[addToCoordKey(coordKey, 0, 0)].card;

  for (const street of streets ?? []) {
    const boisPerPlayer = new Map<string, number>();
    const visited = new Set<VisitedKey>();
    const cellsToClearBoisFrom: ServerCell[] = [];

    const result = checkFinishedStreet(
      cells,
      coord,
      street.connections[0],
      visited,
      boisPerPlayer,
      cellsToClearBoisFrom
    );

    if (result) {
      const maxBoisOnStreet = Math.max(...boisPerPlayer.values());

      addMapToMap(
        pointsGainedPerPlayer,
        filterThenSetAll(
          boisPerPlayer,
          (value) => value === maxBoisOnStreet,
          visited.size
        )
      );

      for (const cell of cellsToClearBoisFrom) {
        cell.claimedPos = undefined;
      }

      mergeMaps(regainedBoisPerPlayer, boisPerPlayer);
    }
  }

  return { regainedBoisPerPlayer, pointsGainedPerPlayer };
}

function checkFinishedStreet(
  cells: Record<CoordinateKey, ServerCell>,
  coord: Coordinate,
  entry: CellConnection,
  visited: Set<VisitedKey>,
  boisPerPlayer: Map<string, number>,
  cellsToClearBoisFrom: ServerCell[]
): boolean {
  const { x, y } = coord;
  const coordKey = newCoordKey(coord);
  const cell = cells[coordKey];
  const street = cell.card.streets.find((street) =>
    street.connections.includes(entry)
  );

  if (street === undefined) {
    throw new Error("Street not found");
  }

  const { connections } = street;
  const key = visitedKey(coordKey, connections);

  if (visited.has(key)) {
    return true;
  }

  visited.add(key);

  function posEquals(a: [number, number], b: [number, number]) {
    return a[0] === b[0] && a[1] === b[1];
  }

  // check if boi is on the street
  if (cell.claimedPos !== undefined) {
    const { playerId } = cell.claimedPos;

    if (posEquals(cell.claimedPos.position, street.claimPos)) {
      boisPerPlayer.set(playerId, (boisPerPlayer.get(playerId) ?? 0) + 1);
      cellsToClearBoisFrom.push(cell);
    }
  }

  for (const connection of connections) {
    const newCoord = {
      x: x + (connection === "left" ? -1 : connection === "right" ? 1 : 0),
      y: y + (connection === "top" ? -1 : connection === "bottom" ? 1 : 0),
    };

    const cell = cells[newCoordKey(newCoord)];

    function invert(connection: CellConnection): CellConnection {
      switch (connection) {
        case "left":
          return "right";
        case "right":
          return "left";
        case "top":
          return "bottom";
        case "bottom":
          return "top";
      }
    }

    if (cell) {
      const result = checkFinishedStreet(
        cells,
        newCoord,
        invert(connection),
        visited,
        boisPerPlayer,
        cellsToClearBoisFrom
      );

      if (!result) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

type VisitedKey = `${CoordinateKey}|${CellConnection}`;

function visitedKey(
  coordKey: CoordinateKey,
  connections: CellConnection[]
): VisitedKey {
  return `${coordKey}|${connections[0]}` as VisitedKey;
}

function addMapToMap(a: Map<string, number>, b: Map<string, number>) {
  for (const [key, value] of b) {
    a.set(key, (a.get(key) ?? 0) + value);
  }
}

function filterThenSetAll(
  map: Map<string, number>,
  predicate: (value: number) => boolean,
  newValue: number
): Map<string, number> {
  const result = new Map<string, number>();

  for (const [key, value] of map) {
    if (predicate(value)) {
      result.set(key, newValue);
    }
  }

  return result;
}
function mergeMaps(
  regainedBoisPerPlayer: Map<string, number>,
  boisPerPlayer: Map<string, number>
) {
  for (const [key, value] of boisPerPlayer) {
    regainedBoisPerPlayer.set(
      key,
      (regainedBoisPerPlayer.get(key) ?? 0) + value
    );
  }
}
