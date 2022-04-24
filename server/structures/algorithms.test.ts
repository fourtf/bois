import { newCoordKey } from "../../shared/shared";
import { rotateCard } from "../cards";
import {
  checkFinishedStructures,
  isBoiOnStructure,
} from "./algorithms";
import { streetWalker } from "./walker";
import { llrr, makeCells } from "../tests";

test("structure-algorithms", () => {
  const cells = makeCells([
    [llrr, 1, 0, 0],
    [rotateCard(llrr, 90), 1, 1, 0],
    [rotateCard(llrr, 180), 0, 1, 0],
    [rotateCard(llrr, 270), 0, 0, 0],
  ]);

  cells[newCoordKey(1, 0)]!.claimedPos = {
    type: "street",
    position: llrr.streets![0]!.claimPos,
    playerId: "xd",
  };

  expect(
    Object.values(cells).find((c) => c.claimedPos !== undefined)
  ).toBeTruthy();

  const res = checkFinishedStructures(cells, { x: 0, y: 0 });

  expect(
    Object.values(cells).find((c) => c.claimedPos !== undefined)
  ).toBeFalsy();

  expect(res).toEqual({
    regainedBoisPerPlayer: new Map([["xd", 1]]),
    pointsGainedPerPlayer: new Map([["xd", 4]]),
  });
});

test("structure-algorithms-negative", () => {
  const cells = makeCells([
    [llrr, 1, 0, 0],
    [rotateCard(llrr, 90), 1, 1, 0],
    [rotateCard(llrr, 180), 0, 1, 0],
  ]);

  cells[newCoordKey(1, 0)]!.claimedPos = {
    type: "street",
    position: llrr.streets![0]!.claimPos,
    playerId: "xd",
  };

  checkFinishedStructures(cells, { x: 1, y: 0 });

  expect(
    Object.values(cells).find((c) => c.claimedPos !== undefined)
  ).toBeTruthy();
});

test("is-boi-on-street", () => {
  const cells = makeCells([
    [llrr, 1, 0, 0],
    [rotateCard(llrr, 90), 1, 1, 0],
    [rotateCard(llrr, 180), 0, 1, 0],
  ]);

  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 1, y: 0 },
      structure: cells[newCoordKey(1, 0)]!.card.streets![0]!,
    })
  ).toEqual(false);
  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 1, y: 1 },
      structure: cells[newCoordKey(1, 1)]!.card.streets![0]!,
    })
  ).toEqual(false);
  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 0, y: 1 },
      structure: cells[newCoordKey(0, 1)]!.card.streets![0]!,
    })
  ).toEqual(false);

  cells[newCoordKey(1, 0)]!.claimedPos = {
    type: "street",
    position: llrr.streets![0]!.claimPos,
    playerId: "xd",
  };

  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 1, y: 0 },
      structure: cells[newCoordKey(1, 0)]!.card.streets![0]!,
    })
  ).toEqual(true);
  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 1, y: 1 },
      structure: cells[newCoordKey(1, 1)]!.card.streets![0]!,
    })
  ).toEqual(true);
  expect(
    isBoiOnStructure(streetWalker, {
      cells,
      coord: { x: 0, y: 1 },
      structure: cells[newCoordKey(0, 1)]!.card.streets![0]!,
    })
  ).toEqual(true);
});
