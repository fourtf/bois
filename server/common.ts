import { Game, hasGameStarted } from "../shared/shared";
import { v4 as uuidv4 } from "uuid";
import type WebSocket from "ws";

export interface GameData {
  game: Game;
  cardsLeft: { id: string }[];

  // extra info that can't be in the game object since it gets sent to the user
  playerData: Record<string, PlayerData>;
  spectatorData: Record<string, SpectatorData>;
}

export interface PlayerData {
  ws: WebSocket;
}

export interface SpectatorData {
  ws: WebSocket;
}

export function defaultGameData(): GameData {
  return {
    game: {
      players: [],
      cells: [
        { cardId: "001", coord: { x: 0, y: 0 } },
        { cardId: "001", coord: { x: 1, y: 0 } },
        { cardId: "001", coord: { x: 2, y: 0 } },
        { cardId: "000", coord: { x: 0, y: 1 } },
      ],
      state: { type: "not-started" },
    },
    cardsLeft: [
      { id: "000" },
      { id: "001" },
      { id: "001" },
      { id: "001" },
    ],
    playerData: {},
    spectatorData: {},
  };
}

/**
 * @returns id of the added player/spectator
 */
export function addPlayerOrSpectator(
  { game, playerData, spectatorData }: GameData,
  ws: WebSocket,
): string {
  const id = uuidv4();

  if (hasGameStarted(game)) {
    playerData[id] = { ws };
    game.players.push({
      id,
      name: "player" + id.substr(0, 6),
      score: 0,
    });
  } else {
    spectatorData[id] = { ws };
  }

  return id;
}

export function removePlayerOrSpectator(
  { game, playerData, spectatorData }: GameData,
  id: string,
) {
  if (id in playerData) {
    delete playerData[id];
    game.players = game.players.filter(
      (p) => p.id !== id,
    );
  }

  if (id in spectatorData) {
    delete spectatorData[id];
  }
}
