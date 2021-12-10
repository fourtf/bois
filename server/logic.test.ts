import { newCoordKey } from "../shared/shared";
import { rotateCard } from "./cards";
import { getClaimPositions, getPlaceablePositions } from "./logic";
import { llsl, makeCells, ssss } from "./tests";

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

test("get-claimed-positions", () => {
  const cells = makeCells([[llsl, 0, 0, 0]]);

  expect(getClaimPositions(cells, { x: 0, y: 0 })).toStrictEqual([
    {
      position: [0.2, 0.2],
      type: "lawn",
    },
    {
      position: [0.5, 0.8],
      type: "street",
    },
    {
      position: [0.5, 0.5],
      type: "monastery",
    },
  ]);

  cells[newCoordKey(0, 0)]!.claimedPos = {
    type: "street",
    position: llsl.streets![0]!.claimPos,
    playerId: "xd",
  };

  expect(getClaimPositions(cells, { x: 0, y: 0 })).toStrictEqual([
    {
      position: [0.2, 0.2],
      type: "lawn",
    },
    {
      position: [0.5, 0.5],
      type: "monastery",
    },
  ]);

  cells[newCoordKey(0, 0)]!.claimedPos = {
    type: "lawn",
    position: llsl.lawns![0]!.claimPos,
    playerId: "xd",
  };

  expect(getClaimPositions(cells, { x: 0, y: 0 })).toStrictEqual([
    {
      position: [0.5, 0.8],
      type: "street",
    },
    {
      position: [0.5, 0.5],
      type: "monastery",
    },
  ]);
});

test("get-claimed-positions-with-connected-cells", () => {
  const slll = rotateCard(llsl, 180);

  const cells = makeCells([
    [llsl, 0, 0, 0],
    [slll, 0, 1, 0],
  ]);

  cells[newCoordKey(0, 1)]!.claimedPos = {
    type: "street",
    position: slll.streets![0]!.claimPos,
    playerId: "xd",
  };

  expect(getClaimPositions(cells, { x: 0, y: 0 })).toStrictEqual([
    {
      position: [0.2, 0.2],
      type: "lawn",
    },
    {
      position: [0.5, 0.5],
      type: "monastery",
    },
  ]);

  cells[newCoordKey(0, 1)]!.claimedPos = {
    type: "lawn",
    position: slll.lawns![0]!.claimPos,
    playerId: "xd",
  };

  expect(getClaimPositions(cells, { x: 0, y: 0 })).toStrictEqual([
    {
      position: [0.5, 0.8],
      type: "street",
    },
    {
      position: [0.5, 0.5],
      type: "monastery",
    },
  ]);
});
