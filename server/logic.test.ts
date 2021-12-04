import type { Cell, State } from "../shared/shared";
import { firstKey } from "../shared/util";
import type { Card } from "./cards";
import type { GameData } from "./common";
import { assertInState, getPlaceablePositions, processMessage } from "./logic";

const gameDataTemplate: Readonly<GameData> = {
  game: {
    players: [],
    cells: [
      { cardId: "001", coord: { x: 0, y: 0 } },
      { cardId: "001", coord: { x: 1, y: 0 } },
      { cardId: "001", coord: { x: 2, y: 0 } },
      { cardId: "000", coord: { x: 0, y: 1 } },
    ],
    state: { type: "draw-card" },
  },
  cardsLeft: [{ id: "000" }, { id: "001" }, { id: "001" }],
  playerData: {},
  spectatorData: {},
};

test("game logic", () => {
  const data: GameData = JSON.parse(JSON.stringify(gameDataTemplate));
  let state: State;

  for (let i = 0; i < 3; i++) {
    expect(data.cardsLeft.length).toBe(3 - i);

    state = data.game.state;
    assertInState(state.type, "draw-card");
    processMessage(data, { type: "draw-card" });

    expect(data.game.cardCount).toBe(3 - i - 1);

    state = data.game.state;
    assertInState(state.type, "play-card");
    processMessage(data, {
      type: "play-card",
      coord: state.coords[0],
    });

    state = data.game.state;
    assertInState(state.type, "place-boi");
    processMessage(data, {
      type: "place-boi",
      claimPosition: state.claimPositions[0],
    });
  }

  expect(data.cardsLeft.length).toBe(0);

  state = data.game.state;
  assertInState(state.type, "game-ended");
});

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

test("get placeable spots", () => {
  // one card with a street on the bottom
  const cells: Cell[] = [{ cardId: "llsl", coord: { x: 0, y: 0 } }];
  const card: Card = testCards.find((c) => c.id === "llsl");

  const p = getPlaceablePositions(cells, card, testCards);

  expect(p).toEqual([
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ]);
});
