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
      spot: firstKey(state.spots),
    });
  }

  expect(data.cardsLeft.length).toBe(0);

  state = data.game.state;
  assertInState(state.type, "game-ended");
});

const testCards: Card[] = [
  {
    // lawn lawn street lawn
    id: "llsl",
    connectors: {
      "top": "lawn",
      "right": "lawn",
      "bottom": "street",
      "left": "lawn",
    },
    spots: {},
  },
  {
    id: "llll",
    connectors: {
      "top": "lawn",
      "right": "lawn",
      "bottom": "lawn",
      "left": "lawn",
    },
    spots: {},
  },
  {
    id: "ssss",
    connectors: {
      "top": "street",
      "right": "street",
      "bottom": "street",
      "left": "street",
    },
    spots: {},
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
