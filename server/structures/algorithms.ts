import {
  addToCoordKey,
  ClaimPos,
  ClaimType,
  Coordinate,
  CoordinateKey,
  newCoordKey,
} from "../../shared/shared";
import { ifMap, maybeToArray, posEquals } from "../../shared/util";
import type { ServerCell } from "../common";
import {
  StructureInfo,
  walkStructure,
  streetWalker,
  cityWalker,
  Walker,
  lawnWalker,
} from "./walker";

export function getClaimPositions(
  cells: Record<string, ServerCell>,
  coord: Coordinate
): ClaimPos[] {
  const mapCP =
    (type: ClaimType) =>
      ({ claimPos: position }: { claimPos: [number, number] }): ClaimPos => ({
        type,
        position,
      });
  const card = cells[newCoordKey(coord)]?.card!;

  return [
    ...(card.lawns
      ?.filter(
        (structure) =>
          !isBoiOnStructure(lawnWalker, { cells, coord, structure })
      )
      ?.map(mapCP("lawn")) ?? []),
    ...(card.streets
      ?.filter(
        (structure) =>
          !isBoiOnStructure(streetWalker, { cells, coord, structure })
      )
      ?.map(mapCP("street")) ?? []),
    ...(card.cities
      ?.filter(
        (structure) =>
          !isBoiOnStructure(cityWalker, { cells, coord, structure })
      )
      ?.map(mapCP("city")) ?? []),
    ...maybeToArray(ifMap(card.monastery, mapCP("monastery"))),
  ];
}

/**
 * @returns points per user gained
 */
export function checkFinishedStructures(
  cells: Record<CoordinateKey, ServerCell>,
  coord: Coordinate
) {
  const regainedBoisPerPlayer = new Map<string, number>();
  const pointsGainedPerPlayer = new Map<string, number>();

  const coordKey = newCoordKey(coord);
  const cell = cells[addToCoordKey(coordKey, 0, 0)];
  if (cell === undefined) {
    throw new Error("cell is undefined");
  }

  const { streets, cities, monastery } = cell.card;

  // streets and cities
  const streetResults =
    streets?.map((structure) =>
      checkFinishedStructure(streetWalker, { cells, coord, structure })
    ) ?? [];

  const cityResults =
    cities?.map((structure) =>
      checkFinishedStructure(cityWalker, { cells, coord, structure })
    ) ?? [];

  // evalutate results
  for (const {
    isStructureFinished,
    boisPerPlayer,
    cellsToClearBoisFrom,
    cellCount,
  } of [...streetResults, ...cityResults]) {
    if (isStructureFinished) {
      const maxBoisOnStreet = Math.max(...boisPerPlayer.values());

      for (const [id, bois] of boisPerPlayer.entries()) {
        if (bois === maxBoisOnStreet) {
          pointsGainedPerPlayer.set(
            id,
            (pointsGainedPerPlayer.get(id) ?? 0) + cellCount.size
          );
        }
      }

      for (const cell of cellsToClearBoisFrom) {
        cell.claimedPos = undefined;
      }

      for (const [key, value] of boisPerPlayer) {
        regainedBoisPerPlayer.set(
          key,
          (regainedBoisPerPlayer.get(key) ?? 0) + value
        );
      }
    }
  }

  /*
  for (let x = coord.x - 1; x <= coord.x + 1; x++) {
    for (let y = coord.y - 1; y <= coord.y + 1; y++) {
      const cell = cells[newCoordKey(x, y)];
      if (
        cell?.card?.monastery !== undefined &&
        cell?.claimedPos?.playerId !== undefined
      ) {
        const { isFinished } = checkFinishedMonastery(
          cells,
          { x, y },
          cell.card.monastery
        );

        if (isFinished) {
          cell.claimedPos = undefined;

          mergeMaps(
            regainedBoisPerPlayer,
            new Map([[cell.claimedPos.playerId, 1]])
          );
          addMapToMap(
            pointsGainedPerPlayer,
            new Map([[cell.claimedPos.playerId, 9]])
          );
          pointsGainedPerPlayer.set(cell.claimedPos.playerId, 0);
        }
      }
    }
  }
  */

  return { regainedBoisPerPlayer, pointsGainedPerPlayer };
}

function checkFinishedStructure<StructureT, ConnectionT extends string>(
  walker: Walker<StructureT, ConnectionT>,
  info: StructureInfo<StructureT>
) {
  return walkStructure(
    walker,
    info,
    (acc, cell, _coord, street) => {
      // check if boi is on the street
      if (cell.claimedPos !== undefined) {
        const { playerId } = cell.claimedPos;

        if (posEquals(cell.claimedPos.position, walker.getClaimPos(street))) {
          acc.boisPerPlayer.set(
            playerId,
            (acc.boisPerPlayer.get(playerId) ?? 0) + 1
          );
          acc.cellsToClearBoisFrom.push(cell);
        }
      }

      acc.cellCount.add(newCoordKey(cell.coord));
      return acc;
    },
    {
      boisPerPlayer: new Map<string, number>(),
      cellsToClearBoisFrom: [] as ServerCell[],
      cellCount: new Set<CoordinateKey>(),
    }
  );
}

export function isBoiOnStructure<T, ConnectionT extends string>(
  walker: Walker<T, ConnectionT>,
  info: StructureInfo<T>
): boolean {
  return walkStructure(
    walker,
    info,
    (acc, cell, _coord, street) => {
      if (cell.claimedPos !== undefined) {
        if (posEquals(cell.claimedPos.position, walker.getClaimPos(street))) {
          acc.res = true;
        }
      }
      return acc;
    },
    { res: false }
  ).res;
}

/**
 * Calculates the points gained by a player for structures that weren't finished
 * at the end of the game.
 */
export function getRemainingPoints(
  cells: Record<CoordinateKey, ServerCell>,
) {

}

function getRemainingLawnPoints(
  cells: Record<CoordinateKey, ServerCell>,
) {
  const pointsPerPlayer = new Map<string, number>();

  for (const [coordKey, cell] of Object.entries(cells)) {
    if (cell.claimedPos !== undefined) {
      const { playerId } = cell.claimedPos;
      pointsPerPlayer.set(
        playerId,
        (pointsPerPlayer.get(playerId) ?? 0) + 1
      );
    }
  }

  return pointsPerPlayer;
}

function getStructures(
  cells: Record<CoordinateKey, ServerCell>,
) {
  // const streets = new Map<CoordinateKey>();

  // const structures = new Map<string, >();
  const handledCells = new Set<CoordinateKey>();

  // for (const [coordKey, cell] of Object.entries(cells)) {
  //   if (cell.card !== undefined) {
  //     const { streets, cities, monastery } = cell.card;

  //     if (streets !== undefined) {
  //       for (const structure of streets) {
  //         walkStructure(streetWalker,
  //           { cells, coord: cell.coord, structure },
  //           (acc, cell, coord, street) => {
              
  //           });

  //         // structures.set(
  //         //   coordKey,
  //         //   structure
  //         // );
  //       }
  //     }

  //     if (cities !== undefined) {
  //       for (const structure of cities) {
  //         structures.set(
  //           newCoordKey(structure.coord),
  //           structure
  //         );
  //       }
  //     }

  //     if (monastery !== undefined) {
  //       structures.set(
  //         newCoordKey(monastery.coord),
  //         monastery
  //       );
  //     }
  //   }
  // }

  // return structures;
}