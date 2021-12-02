export type Coordinate = { x: number; y: number };
export type CoordinateKey = string;

export function newCoordKey(x: number, y: number): CoordinateKey;
export function newCoordKey(coord: Coordinate): CoordinateKey;
export function newCoordKey(x: number | Coordinate, y?: number): CoordinateKey {
  if (typeof (x) === "number") {
    return `${x}|${y}`;
  } else {
    return `${x.x}|${x.y}`;
  }
}

export function parseCoordKey(coord: CoordinateKey): Coordinate {
  const [x, y] = coord.split("|");
  return { x: parseInt(x), y: parseInt(y) };
}

export function addToCoordKey(
  coord: CoordinateKey,
  x: number,
  y: number,
): CoordinateKey {
  const { x: x0, y: y0 } = parseCoordKey(coord);
  return newCoordKey(x0 + x, y0 + y);
}
