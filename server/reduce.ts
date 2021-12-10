import {
  CellConnection,
  Coordinate,
  CoordinateKey,
  LawnConnection,
  newCoordKey,
} from "../shared/shared";
import type { City, Lawn, Street } from "./cards";
import type { ServerCell } from "./common";

export interface Walker<T, ConnectionT extends string> {
  getTFromConnection: (cell: ServerCell, connectingConn: ConnectionT) => T;
  getConnections: (t: T) => ConnectionT[];
  moveToNextCell: (coord: Coordinate, conn: ConnectionT) => Coordinate;
  getClaimPos: (t: T) => [number, number];
}

export const streetWalker: Walker<Street, CellConnection> = {
  getConnections: (street: Street) => street.connections,
  moveToNextCell,
  getTFromConnection: (cell, connecting) =>
    cell.card.streets!.find((street) =>
      street.connections.includes(invertCellConnection(connecting))
    )!,
  getClaimPos,
};

export const cityWalker: Walker<City, CellConnection> = {
  getTFromConnection: (cell, connectingConn) =>
    cell.card.cities!.find((city) =>
      city.connections.includes(invertCellConnection(connectingConn))
    )!,
  getConnections: (city: City) => city.connections,
  moveToNextCell,
  getClaimPos,
};

export const lawnWalker: Walker<Lawn, LawnConnection> = {
  getConnections: (lawn: Lawn) => lawn.connections,
  getTFromConnection: (cell, connectingConn) =>
    cell.card.lawns!.find((lawn) =>
      lawn.connections.includes(invertLawnConnection(connectingConn))
    )!,
  moveToNextCell: ({ x, y }, conn) => ({
    x: x + (conn.startsWith("left") ? -1 : conn.startsWith("right") ? 1 : 0),
    y: y + (conn.startsWith("top") ? -1 : conn.startsWith("bottom") ? 1 : 0),
  }),
  getClaimPos,
};

function getClaimPos(x: { claimPos: [number, number] }): [number, number] {
  return x.claimPos;
}

/**
 * Allows walking building such as streets and cities which are connected and
 * may contain multiple differerent buildings in the same cell. To allow this
 * we can't simply track the visited cells by their coordinates as it could be
 * e.g. the same street running through a cell twice. So we also include the
 * first connection of the cell.
 *
 * We first supply some functions to allow generalizing the algorithm. Then,
 * a second function is returned which can be supplied with the starting cell,
 * etc. This allows for easy generalization.
 *
 * @returns true if the building is finished
 */
export function reduceStructure<
  StructureT,
  ConnectionT extends string,
  AccT extends object
>(
  {
    getTFromConnection,
    getConnections,
    moveToNextCell,
  }: Walker<StructureT, ConnectionT>,
  { cells, coord: startCoord, structure: startT }: StructureInfo<StructureT>,
  fn: (acc: AccT, cell: ServerCell, coord: Coordinate, el: StructureT) => AccT,
  initial: AccT
): { isStructureFinished: boolean } & AccT {
  const queue: [Coordinate, StructureT][] = [[startCoord, startT]];
  const visited = new Set<VisitedKey>([
    newVisitedKey(newCoordKey(startCoord), getConnections(startT)),
  ]);
  let isStructureFinished = true;
  let acc = initial;

  while (queue.length > 0) {
    const [currentCoord, currentT] = queue.pop()!;

    acc = fn(acc, cells[newCoordKey(currentCoord)]!, currentCoord, currentT);

    for (const conn of getConnections(currentT)) {
      const coord = moveToNextCell(currentCoord, conn);
      const cell = cells[newCoordKey(coord)];

      // if the cell doesn't exist then the building is not finished
      if (cell === undefined) {
        isStructureFinished = false;
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

  return { ...acc, isStructureFinished };
}

export interface StructureInfo<StructureT> {
  cells: Record<CoordinateKey, ServerCell>;
  coord: Coordinate;
  structure: StructureT;
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

type VisitedKey = `${CoordinateKey}|${CellConnection}`;

function newVisitedKey(
  coordKey: CoordinateKey,
  connections: string[]
): VisitedKey {
  return `${coordKey}|${connections[0]}` as VisitedKey;
}
