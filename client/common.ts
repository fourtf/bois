import type { StateTypes as StateType } from "../shared/shared";

export const cellSize = 100;
export const cellOffset = 102;
export const boiSize: number = 35;

export function getCardImage(cardId: string): string {
  return `/images/images-${cardId}.png`;
}

export function makeReconnectingWebSocket(
  {
    url,
    protocols,
    onopen,
    onmessage,
    onclose: onclose_,
  }: {
    url: string;
    protocols?: string | string[];
    onopen?: WebSocket["onopen"];
    onmessage?: WebSocket["onmessage"];
    onclose?: WebSocket["onclose"];
  },
): () => WebSocket {
  let ws: WebSocket;

  function retry() {
    ws = new WebSocket(url, protocols);
    ws.onopen = onopen.bind(ws);
    ws.onmessage = onmessage.bind(ws);
    const onClose = onclose_.bind(ws);
    ws.onclose = (ev) => {
      setTimeout(retry, 5000);
      onClose(ev);
    };
  }

  retry();

  return () => ws;
}

export const titleOfState: { [type in StateType]: string } = {
  "not-started": "Game hasn't started",
  "draw-card": "Draw a card",
  "play-card": "Play a card",
  "place-boi": "Place a boi",
  "game-ended": "The game has ended",
};
