import type { State } from "../shared/shared";
import { assertInState } from "./common";
import { processMessage } from "./logic";
import { ServerGame } from "./server-game";
import { defaultCards, defaultCells, llll, llsl } from "./tests";
import type WebSocket from "ws";
import { ServerLobby } from "./server-lobby";

test("simple game logic", () => {
  const sg = new ServerGame();

  sg.newGame(defaultCells, [llll]);
  sg.startGame();
  sg.drawCard();
  sg.playCard({ x: -1, y: 0 });
  sg.endTurn();

  expect(sg.state.type).toBe("game-ended");
});

test("illegal move test", () => {
  const sg = new ServerGame();

  sg.newGame([{ card: llll, coord: { x: 0, y: 0 } }], [llsl]);
  sg.startGame();
  sg.drawCard();
  expect(() => sg.playCard({ x: 0, y: -1 })).toThrow();
});

test("illegal move test 2", () => {
  const sg = new ServerGame();

  sg.newGame([{ card: llll, coord: { x: 0, y: 0 } }], [llsl]);
  sg.startGame();
  sg.drawCard();
  sg.rotateCard(); //
  expect(() => sg.playCard({ x: 1, y: 0 })).toThrow();
});

test("rotation game logic", () => {
  const sg = new ServerGame();

  sg.newGame([{ card: llll, coord: { x: 0, y: 0 } }], [llsl, llsl]);
  sg.startGame();
  sg.drawCard();
  sg.rotateCard();
  sg.playCard({ x: -1, y: 0 });
  sg.endTurn();
  sg.drawCard();
  sg.rotateCard();
  expect(() => sg.playCard({ x: -2, y: 0 })).toThrow();
});

test("game logic", () => {
  const lobby = new ServerLobby();
  const sg = lobby.game;
  let state: State;

  const wsMock = {} as WebSocket;
  lobby.addClient(wsMock);
  lobby.joinGame(wsMock);
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
    expect(state.coords[0]).toBeTruthy();
    processMessage(sg, {
      type: "play-card",
      coord: state.coords[0]!,
    });

    state = sg.state;
    assertInState(state.type, "place-boi");
    if (state.claimPositions.length === 0) {
      processMessage(sg, {
        type: "skip-placing-boi",
      });
    } else {
      processMessage(sg, {
        type: "place-boi",
        claimPos: state.claimPositions[0]!,
      });
    }
  }

  expect(sg.cardsLeft.length).toBe(0);

  state = sg.state;
  assertInState(state.type, "game-ended");
});
