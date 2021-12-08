import {
  addToCoordKey,
  Cell,
  CellConnection,
  Coordinate,
  CoordinateKey,
  LawnConnection,
  newCoordKey,
} from "../shared/shared";
import type { City, Lawn, Street } from "./cards";
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
    const { isFinished, boisPerPlayer, cellsToClearBoisFrom, cellCount } =
      checkFinishedStreet(cells, coord, street);

    if (isFinished) {
      const maxBoisOnStreet = Math.max(...boisPerPlayer.values());

      addMapToMap(
        pointsGainedPerPlayer,
        filterThenSetAll(
          boisPerPlayer,
          (value) => value === maxBoisOnStreet,
          cellCount
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

// Allows walking building such as streets and cities which are connected and
// may contain multiple differerent buildings in the same cell. To allow this
// we can't simply track the visited cells by their coordinates as it could be
// e.g. the same street running through a cell twice. So we also include the
// first connection of the cell.
//
// We first supply some functions to allow generalizing the algorithm. Then,
// a second function is returned which can be supplied with the starting cell,
// etc. This allows for easy generalization.
const walker =
  <T, ConnectionT extends string>({
    getTFromConnection,
    getConnections,
    moveToNextCell: getNewCoord,
  }: {
    getTFromConnection: (cell: ServerCell, connectingConn: ConnectionT) => T;
    getConnections: (t: T) => ConnectionT[];
    moveToNextCell: (coord: Coordinate, conn: ConnectionT) => Coordinate;
  }) =>
  (
    cells: Record<CoordinateKey, ServerCell>,
    startCoord: Coordinate,
    startT: T,
    fn: (cell: ServerCell, coord: Coordinate, el: T) => void
  ) => {
    const queue: [Coordinate, T][] = [[startCoord, startT]];
    const visited = new Set<VisitedKey>([
      newVisitedKey(newCoordKey(startCoord), getConnections(startT)),
    ]);
    let isFinished = true;

    while (queue.length > 0) {
      const [currentCoord, currentT] = queue.pop()!;

      fn(cells[newCoordKey(currentCoord)], currentCoord, currentT);

      for (const conn of getConnections(currentT)) {
        const coord = getNewCoord(currentCoord, conn);
        const cell = cells[newCoordKey(coord)];

        // if the cell doesn't exist then the building is not finished
        if (cell === undefined) {
          isFinished = false;
          continue;
        }

        // get next element in one direction
        const t = getTFromConnection(cell, conn);
        if (t === undefined) {
          throw new Error("Street not found");
        }

        // add to queue if not visited
        const key = newVisitedKey(newCoordKey(coord), getConnections(t));
        if (!visited.has(key)) {
          visited.add(key);

          queue.push([coord, t!]);
        }
      }
    }
    return isFinished;
  };

const walkStreet = walker<Street, CellConnection>({
  getConnections: (street: Street) => street.connections,
  moveToNextCell,
  getTFromConnection: (cell, connecting) =>
    cell.card.streets.find((s) =>
      s.connections.includes(invertCellConnection(connecting))
    ),
});

const walkCity = walker<City, CellConnection>({
  getTFromConnection: (cell, connectingConn) =>
    cell.card.cities.find((s) =>
      s.connections.includes(invertCellConnection(connectingConn))
    ),
  getConnections: (city: City) => city.connections,
  moveToNextCell,
});

const walkLawn = walker<Lawn, LawnConnection>({
  getConnections: (lawn: Lawn) => lawn.connections,
  getTFromConnection: (cell, connectingConn) =>
    cell.card.lawns.find((l) =>
      l.connections.includes(invertLawnConnection(connectingConn))
    ),
  moveToNextCell: ({ x, y }, conn) => ({
    x: x + (conn.startsWith("left") ? -1 : conn.startsWith("right") ? 1 : 0),
    y: y + (conn.startsWith("top") ? -1 : conn.startsWith("bottom") ? 1 : 0),
  }),
});

function checkFinishedStreet(
  cells: Record<CoordinateKey, ServerCell>,
  coord: Coordinate,
  street: Street
): {
  isFinished: boolean;
  boisPerPlayer: Map<string, number>;
  cellsToClearBoisFrom: ServerCell[];
  cellCount: number;
} {
  let boisPerPlayer = new Map<string, number>();
  let cellsToClearBoisFrom: ServerCell[] = [];
  let cellCount = new Set<CoordinateKey>();

  const isFinished = walkStreet(
    cells,
    coord,
    street,
    (cell, _coord, street) => {
      // check if boi is on the street
      if (cell.claimedPos !== undefined) {
        const { playerId } = cell.claimedPos;

        if (posEquals(cell.claimedPos.position, street.claimPos)) {
          boisPerPlayer.set(playerId, (boisPerPlayer.get(playerId) ?? 0) + 1);
          cellsToClearBoisFrom.push(cell);
        }
      }

      cellCount.add(newCoordKey(cell.coord));
    }
  );

  return {
    isFinished,
    boisPerPlayer,
    cellsToClearBoisFrom,
    cellCount: cellCount.size,
  };
}

type VisitedKey = `${CoordinateKey}|${CellConnection}`;

function newVisitedKey(
  coordKey: CoordinateKey,
  connections: string[]
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

function invertCellConnection(connection: CellConnection): CellConnection {
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

function posEquals(a: [number, number], b: [number, number]) {
  return a[0] === b[0] && a[1] === b[1];
}

function invertLawnConnection(connection: LawnConnection): LawnConnection {
  switch (connection) {
    case "bottomLeft":
      return "topLeft";
    case "bottomRight":
      return "topRight";
    case "topLeft":
      return "bottomLeft";
    case "topRight":
      return "bottomRight";
    case "rightBottom":
      return "leftBottom";
    case "rightTop":
      return "leftTop";
    case "leftBottom":
      return "rightBottom";
    case "leftTop":
      return "rightTop";
  }
}

function moveToNextCell(coord: Coordinate, conn: CellConnection) {
  return {
    x: coord.x + (conn === "left" ? -1 : conn === "right" ? 1 : 0),
    y: coord.y + (conn === "top" ? -1 : conn === "bottom" ? 1 : 0),
  };
}
