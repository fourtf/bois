import { baseSet } from "./cards";

test("base set card count", () => {
  // not 72 cards because the starting card is not included
  expect(baseSet.cards.length).toBe(71);
});

test("no cards are undefined", () => {
  // not 72 cards because the starting card is not included
  expect(
    baseSet.cards.reduce((acc, card) => acc || card === undefined, false)
  ).toBe(false);
});
