import { CoordinateKey, newCoordKey, Rotation } from "../shared/shared";
import { Card, rotateCard } from "./cards";
import type { ServerCell } from "./common";
import { getPlaceablePositions } from "./logic";
import { llll, llsl, makeCells, ssss, testCards } from "./tests";

test("get placeable spots", () => {
  // one card with a street on the bottom
  const cells = makeCells([[llsl, 0, 0, 0]]);
  const p = getPlaceablePositions(cells, llsl);

  expect(p).toEqual([
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ]);
});

test("rotation", () => {
  const cells = makeCells([[llsl, 0, 0, 0]]);
  let p = getPlaceablePositions(cells, rotateCard(llsl, 90));

  expect(p).toEqual([
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ]);

  p = getPlaceablePositions(cells, rotateCard(llsl, 90));
  expect(p).toEqual([
    { x: -1, y: 0 },
    { x: 0, y: -1 },
  ]);
});

test("rotation-360", () => {
  expect(
    rotateCard(rotateCard(rotateCard(rotateCard(llsl, 90), 90), 90), 90)
  ).toEqual(llsl);

  expect(
    rotateCard(rotateCard(rotateCard(rotateCard(llsl, 180), 270), 90), 180)
  ).toEqual(llsl);

  expect(
    rotateCard(rotateCard(rotateCard(rotateCard(ssss, 90), 90), 90), 90)
  ).toEqual(ssss);
});
