import { CoordinateKey, newCoordKey, Rotation } from "../shared/shared";
import type { Card } from "./cards";
import type { ServerCell } from "./common";

export const llsl: Card = {
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
};
export const llll: Card = {
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
};
export const ssss: Card = {
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
};

//      lawn
// road      lawn
//      road

export const llrr: Card = {
  id: "021",
  streets: [{ claimPos: [0.4, 0.6], connections: ["bottom", "left"] }],
  lawns: [
    { claimPos: [0.2, 0.8], connections: ["bottomLeft", "leftBottom"] },
    {
      claimPos: [0.8, 0.2],
      connections: [
        "topLeft",
        "topRight",
        "bottomRight",
        "leftTop",
        "rightTop",
        "rightBottom",
      ],
    },
  ],
};

export const defaultCells: ServerCell[] = [
  { card: llll, coord: { x: 0, y: 0 } },
  { card: llll, coord: { x: 1, y: 0 } },
  { card: llll, coord: { x: 2, y: 0 } },
  { card: llsl, coord: { x: 0, y: 1 } },
];
export const defaultCards: Card[] = [llll, llsl, llsl];

export function makeCells(
  data: [Card, number, number, Rotation][]
): Record<CoordinateKey, ServerCell> {
  const cells: Record<CoordinateKey, ServerCell> = {};
  for (const [c, x, y, rot] of data) {
    cells[newCoordKey({ x, y })] = {
      card: c,
      coord: { x, y },
      rotation: rot,
    };
  }
  return cells;
}
