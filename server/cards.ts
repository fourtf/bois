import e from "express";
import type {
  CellConnection,
  CityEffect,
  ClaimPos,
  ClaimType,
  LawnConnection,
  Rotation,
  StreetEffect,
} from "../shared/shared";
import { ifMap as mapMaybe, maybeToArray } from "../shared/util";
import type { ServerCell } from "./common";

export interface Card {
  id: string;
  cities?: City[];
  streets?: Street[];
  lawns?: Lawn[];
  monastery?: Monastery;
}
export interface City {
  claimPos: [number, number];
  effects?: CityEffect[];
  connections: CellConnection[];
}
export interface Street {
  claimPos: [number, number];
  effects?: StreetEffect[];
  connections: CellConnection[];
}
export interface Lawn {
  claimPos: [number, number];
  connections: LawnConnection[];
}
export interface Monastery {
  claimPos: [number, number];
}

export type CardId = { id: string };

export const allCards: Card[] = [
  {
    id: "000",
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
    id: "001",
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
    id: "002",
    cities: [
      {
        claimPos: [0.5, 0.5],
        effects: ["coatOfArms"],
        connections: ["top", "bottom", "left", "right"],
      },
    ],
  },
  {
    id: "003",
    cities: [{ claimPos: [0.5, 0.2], connections: ["top"] }],
    streets: [{ claimPos: [0.5, 0.5], connections: ["left", "right"] }],
    lawns: [
      { claimPos: [0.2, 0.35], connections: ["leftTop", "rightTop"] },
      {
        claimPos: [0.5, 0.8],
        connections: ["bottomLeft", "bottomRight", "leftBottom", "rightBottom"],
      },
    ],
  },
  {
    id: "004",
    cities: [{ claimPos: [0.5, 0.2], connections: ["top"] }],
    lawns: [
      {
        claimPos: [0.5, 0.5],
        connections: [
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
    id: "005",
    cities: [
      {
        claimPos: [0.5, 0.5],
        effects: ["coatOfArms"],
        connections: ["left", "right"],
      },
    ],
    lawns: [
      { claimPos: [0.5, 0.1], connections: ["topLeft", "topRight"] },
      { claimPos: [0.5, 0.8], connections: ["bottomLeft", "bottomRight"] },
    ],
  },
  {
    id: "006",
    cities: [{ claimPos: [0.5, 0.5], connections: ["left", "right"] }],
    lawns: [
      { claimPos: [0.5, 0.1], connections: ["topLeft", "topRight"] },
      { claimPos: [0.5, 0.8], connections: ["bottomLeft", "bottomRight"] },
    ],
  },
  {
    id: "007",
    cities: [
      { claimPos: [0.2, 0.5], connections: ["left"] },
      { claimPos: [0.8, 0.5], connections: ["right"] },
    ],
    lawns: [
      {
        claimPos: [0.5, 0.5],
        connections: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
      },
    ],
  },
  {
    id: "008",
    cities: [
      { claimPos: [0.5, 0.1], connections: ["top"] },
      { claimPos: [0.8, 0.5], connections: ["right"] },
    ],
    lawns: [
      {
        claimPos: [0.4, 0.6],
        connections: ["bottomLeft", "bottomRight", "leftTop", "leftBottom"],
      },
    ],
  },
  {
    id: "009",
    cities: [{ claimPos: [0.5, 0.2], connections: ["top"] }],
    streets: [{ claimPos: [0.6, 0.6], connections: ["bottom", "right"] }],
    lawns: [
      {
        claimPos: [0.2, 0.5],
        connections: ["bottomLeft", "leftTop", "leftBottom", "rightTop"],
      },
      { claimPos: [0.8, 0.8], connections: ["bottomRight", "rightBottom"] },
    ],
  },
  {
    id: "010",
    cities: [{ claimPos: [0.5, 0.2], connections: ["top"] }],
    streets: [{ claimPos: [0.4, 0.6], connections: ["bottom", "left"] }],
    lawns: [
      {
        claimPos: [0.8, 0.5],
        connections: ["bottomRight", "leftTop", "rightTop", "rightBottom"],
      },
      { claimPos: [0.2, 0.8], connections: ["bottomLeft", "leftBottom"] },
    ],
  },
  {
    id: "011",
    cities: [{ claimPos: [0.5, 0.2], connections: ["top"] }],
    streets: [
      { claimPos: [0.2, 0.5], connections: ["left"] },
      { claimPos: [0.8, 0.5], connections: ["right"] },
      { claimPos: [0.5, 0.8], connections: ["bottom"] },
    ],
    lawns: [
      { claimPos: [0.6, 0.35], connections: ["leftTop", "rightTop"] },
      { claimPos: [0.8, 0.8], connections: ["bottomRight", "rightBottom"] },
      { claimPos: [0.2, 0.8], connections: ["bottomLeft", "leftBottom"] },
    ],
  },
  {
    id: "012",
    cities: [
      {
        claimPos: [0.2, 0.2],
        effects: ["coatOfArms"],
        connections: ["top", "left"],
      },
    ],
    lawns: [
      {
        claimPos: [0.7, 0.7],
        connections: ["bottomLeft", "bottomRight", "rightTop", "rightBottom"],
      },
    ],
  },
  {
    id: "013",
    cities: [{ claimPos: [0.2, 0.2], connections: ["top", "left"] }],
    lawns: [
      {
        claimPos: [0.7, 0.7],
        connections: ["bottomLeft", "bottomRight", "rightTop", "rightBottom"],
      },
    ],
  },
  {
    id: "014",
    cities: [
      {
        claimPos: [0.2, 0.2],
        effects: ["coatOfArms"],
        connections: ["top", "left"],
      },
    ],
    streets: [{ claimPos: [0.7, 0.7], connections: ["bottom", "right"] }],
    lawns: [
      { claimPos: [0.6, 0.6], connections: ["bottomLeft", "rightTop"] },
      { claimPos: [0.9, 0.9], connections: ["bottomRight", "rightBottom"] },
    ],
  },
  {
    id: "015",
    cities: [{ claimPos: [0.2, 0.2], connections: ["top", "left"] }],
    streets: [{ claimPos: [0.7, 0.7], connections: ["bottom", "right"] }],
    lawns: [
      { claimPos: [0.6, 0.6], connections: ["bottomLeft", "rightTop"] },
      { claimPos: [0.9, 0.9], connections: ["bottomRight", "rightBottom"] },
    ],
  },
  {
    id: "016",
    cities: [
      {
        claimPos: [0.5, 0.4],
        effects: ["coatOfArms"],
        connections: ["top", "left", "right"],
      },
    ],
    lawns: [
      {
        claimPos: [0.5, 0.8],
        connections: ["bottomLeft", "bottomRight"],
      },
    ],
  },
  {
    id: "017",
    cities: [{ claimPos: [0.5, 0.4], connections: ["top", "left", "right"] }],
    lawns: [
      {
        claimPos: [0.5, 0.8],
        connections: ["bottomLeft", "bottomRight"],
      },
    ],
  },
  {
    id: "018",
    cities: [
      {
        claimPos: [0.5, 0.4],
        effects: ["coatOfArms"],
        connections: ["top", "left", "right"],
      },
    ],
    streets: [{ claimPos: [0.5, 0.8], connections: ["bottom"] }],
    lawns: [
      { claimPos: [0.25, 0.8], connections: ["bottomLeft"] },
      { claimPos: [0.75, 0.8], connections: ["bottomRight"] },
    ],
  },
  {
    id: "019",
    cities: [{ claimPos: [0.5, 0.4], connections: ["top", "left", "right"] }],
    streets: [{ claimPos: [0.5, 0.8], connections: ["bottom"] }],
    lawns: [
      { claimPos: [0.25, 0.8], connections: ["bottomLeft"] },
      { claimPos: [0.75, 0.8], connections: ["bottomRight"] },
    ],
  },
  {
    id: "020",
    streets: [{ claimPos: [0.5, 0.5], connections: ["top", "bottom"] }],
    lawns: [
      {
        claimPos: [0.2, 0.5],
        connections: ["topLeft", "bottomLeft", "leftTop", "leftBottom"],
      },
      {
        claimPos: [0.8, 0.5],
        connections: ["topRight", "bottomRight", "rightTop", "rightBottom"],
      },
    ],
  },
  {
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
  },
  {
    id: "022",
    streets: [
      { claimPos: [0.2, 0.5], connections: ["left"] },
      { claimPos: [0.8, 0.5], connections: ["right"] },
      { claimPos: [0.5, 0.8], connections: ["bottom"] },
    ],
    lawns: [
      {
        claimPos: [0.5, 0.2],
        connections: ["topLeft", "topRight", "leftTop", "rightTop"],
      },
      { claimPos: [0.2, 0.8], connections: ["bottomLeft", "leftBottom"] },
      { claimPos: [0.8, 0.8], connections: ["bottomRight", "rightBottom"] },
    ],
  },
  {
    id: "023",
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

export const cardsById: { [id: string]: Card } = allCards.reduce(
  (acc, card) => {
    acc[card.id] = card;
    return acc;
  },
  {} as { [id: string]: Card }
);

export const baseSet = {
  cells: <ServerCell>{ card: cardsById["001"], coord: { x: 0, y: 0 } },
  cards: [
    cardsById["000"],
    cardsById["000"],
    cardsById["000"],
    cardsById["001"],
  ],
};

export function rotateCard(card: Card, delta: Rotation): Card {
  function roundClaimPos(claimPos: [number, number]): [number, number] {
    return [
      Math.round(claimPos[0] * 100) / 100,
      Math.round(claimPos[1] * 100) / 100,
    ];
  }

  for (let i = 0; i < delta / 90; i++) {
    card = {
      id: card.id,
      cities: card.cities?.map((city) => ({
        // claimPos: roundClaimPos([city.claimPos[1], 1 - city.claimPos[0]]),
        claimPos: city.claimPos,
        connections: city.connections.map((connection) =>
          connection === "top"
            ? "right"
            : connection === "right"
            ? "bottom"
            : connection === "bottom"
            ? "left"
            : connection === "left"
            ? "top"
            : connection
        ),
      })),
      streets: card.streets?.map((street) => ({
        // claimPos: roundClaimPos([street.claimPos[1], 1 - street.claimPos[0]]),
        claimPos: street.claimPos,
        connections: street.connections.map((connection) =>
          connection === "top"
            ? "right"
            : connection === "right"
            ? "bottom"
            : connection === "bottom"
            ? "left"
            : connection === "left"
            ? "top"
            : connection
        ),
      })),
      lawns: card.lawns?.map((lawn) => ({
        // claimPos: roundClaimPos([lawn.claimPos[1], 1 - lawn.claimPos[0]]),
        claimPos: lawn.claimPos,
        connections: lawn.connections.map((connection) =>
          connection === "topLeft"
            ? "rightTop"
            : connection === "topRight"
            ? "rightBottom"
            : connection === "bottomLeft"
            ? "leftTop"
            : connection === "bottomRight"
            ? "leftBottom"
            : connection === "rightTop"
            ? "bottomRight"
            : connection === "rightBottom"
            ? "bottomLeft"
            : connection === "leftTop"
            ? "topRight"
            : connection === "leftBottom"
            ? "topLeft"
            : connection
        ),
      })),
      ...(card.monastery
        ? {
            monastery: {
              // claimPos: [
              //   card.monastery.claimPos[1],
              //   1 - card.monastery.claimPos[0],
              // ],
              claimPos: card.monastery.claimPos,
            },
          }
        : {}),
    };
  }

  return card;
}

export function getClaimPositions(card: Card): ClaimPos[] {
  const mapCP =
    (type: ClaimType) =>
    ({ claimPos: position }): ClaimPos => ({ type, position });

  return [
    ...(card.lawns?.map(mapCP("lawn")) ?? []),
    ...(card.streets?.map(mapCP("street")) ?? []),
    ...(card.cities?.map(mapCP("city")) ?? []),
    ...maybeToArray(mapMaybe(card.monastery, mapCP("monastery"))),
  ];
}

export function getConnector(card: Card, conn: CellConnection): string {
  return card.streets?.find(({ connections }) => connections.includes(conn))
    ? "street"
    : card.cities?.find(({ connections }) => connections.includes(conn))
    ? "city"
    : "lawn";
}
