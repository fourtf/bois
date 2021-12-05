import { CoordinateKey, newCoordKey, State } from "../shared/shared";
import { firstKey } from "../shared/util";
import type { Card } from "./cards";
import { assertInState, ServerCell } from "./common";
import { getPlaceablePositions, processMessage } from "./logic";
import { ServerGame } from "./server-game";

const testCards: Card[] = [
  {
    id: "llsl",
    streets: [{ claimPos: [0.5, 0.8], connections: ["bottom"] }],
    lawns: [
      {
        claimPos: [0.2, 0.2],
        connections: [
          "topLeft",
          "topRight",
          "bottomLeft",
          "bottomRight",
          "leftTop",
          "leftBottom",
          "rightTop",
          "rightBottom",
        ],
      },
    ],
    monastery: { claimPos: [0.5, 0.5] },
  },
  {
    id: "llll",
    lawns: [
      {
        claimPos: [0.2, 0.2],
        connections: [
          "topLeft",
          "topRight",
          "bottomLeft",
          "bottomRight",
          "leftTop",
          "leftBottom",
          "rightTop",
          "rightBottom",
        ],
      },
    ],
  },
  {
    id: "ssss",
    streets: [
      { claimPos: [0.5, 0.2], connections: ["top"] },
      { claimPos: [0.2, 0.5], connections: ["left"] },
      { claimPos: [0.8, 0.5], connections: ["right"] },
      { claimPos: [0.5, 0.8], connections: ["bottom"] },
    ],
    lawns: [
      { claimPos: [0.2, 0.2], connections: ["topLeft", "leftTop"] },
      { claimPos: [0.8, 0.2], connections: ["topRight", "rightTop"] },
      { claimPos: [0.2, 0.8], connections: ["bottomLeft", "leftBottom"] },
      { claimPos: [0.8, 0.8], connections: ["bottomRight", "rightBottom"] },
    ],
  },
];

const defaultCells: ServerCell[] = [
  { card: testCards[1], coord: { x: 0, y: 0 } },
  { card: testCards[1], coord: { x: 1, y: 0 } },
  { card: testCards[1], coord: { x: 2, y: 0 } },
  { card: testCards[0], coord: { x: 0, y: 1 } },
];
const defaultCards: Card[] = [testCards[1], testCards[0], testCards[0]];

test("game logic", () => {
  const sg = new ServerGame();
  let state: State;

  sg.newGame(defaultCells, defaultCards);

  state = sg.state;
  assertInState(state.type, "not-started");
  sg.startGame();

  for (let i = 0; i < 3; i++) {
    expect(sg.cardsLeft.length).toBe(3 - i);

    state = sg.state;
    assertInState(state.type, "draw-card");
    processMessage(sg, { type: "draw-card" });

    expect(sg.cardsLeft.length).toBe(3 - i - 1);

    state = sg.state;
    assertInState(state.type, "play-card");
    processMessage(sg, {
      type: "play-card",
      coord: state.coords[0],
    });

    state = sg.state;
    assertInState(state.type, "place-boi");
    processMessage(sg, {
      type: "place-boi",
      claimPosition: state.claimPositions[0],
    });
  }

  expect(sg.cardsLeft.length).toBe(0);

  state = sg.state;
  assertInState(state.type, "game-ended");
});

test("get placeable spots", () => {
  // one card with a street on the bottom
  const cells: Record<CoordinateKey, ServerCell> = {
    [newCoordKey({ x: 0, y: 0 })]: {
      card: testCards[0],
      coord: { x: 0, y: 0 },
    },
  };
  const card: Card = testCards.find((c) => c.id === "llsl");

  const p = getPlaceablePositions(cells, card);

  expect(p).toEqual([
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ]);
});
