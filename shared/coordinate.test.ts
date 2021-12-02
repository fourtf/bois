import {
  addToCoordKey,
  CoordinateKey,
  newCoordKey,
  parseCoordKey,
} from "./shared";

test("addToIndex", () => {
  const index: CoordinateKey = newCoordKey(1, 2);

  expect(parseCoordKey(addToCoordKey(index, 1, 2))).toEqual({ x: 2, y: 4 });
  expect(parseCoordKey(addToCoordKey(index, -2, -4))).toEqual({ x: -1, y: -2 });
});
