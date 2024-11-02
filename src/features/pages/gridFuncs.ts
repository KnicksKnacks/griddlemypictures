import { nanoid } from "@reduxjs/toolkit";
import { GridDef } from "./photoCellSlice";

function buildCol(X: GridDef[] | number, flex = 1): GridDef {
  if (typeof X === "number") {
    let children: GridDef[] = Array(X)
      .fill(0)
      .map((x) => {
        const t: GridDef = {
          cellId: "GridSelection",
          flex: 1,
          id: nanoid(),
        };
        return t;
      });
    X = children;
  }
  return {
    id: nanoid(),
    children: X,
    flex: flex,
  };
}

const buildRow = buildCol;

export const gridDefs = [
  [buildRow([buildCol(2), buildCol(1, 2), buildCol(2)], 2), buildRow(2)],
  [buildRow([buildCol(3), buildCol(2, 2), buildCol(3)])],
  [buildRow(4), buildRow(2, 2), buildRow(4)],
  [
    buildRow([buildCol(1, 3), buildCol(2)]),
    buildRow([buildCol(2), buildCol(1, 3)]),
  ],
  [
    buildRow([buildCol([buildRow(1, 3), buildRow(3)], 3), buildCol(2)], 2),
    buildRow([buildCol(1, 2), buildCol(2), buildCol(1, 3)]),
  ],
  [buildRow(4), buildRow(4), buildRow(4)],
  [buildRow([buildCol(3), buildCol(3)], 2), buildRow(4)],
  [buildRow(4, 2), buildRow(3), buildRow(5, 2)],
  [
    buildRow(10),
    buildRow([buildCol(6), buildCol(2, 4), buildCol(2, 4), buildCol(6)], 6),
    buildRow(10),
  ],
  [
    buildRow(5),
    buildRow([buildCol(3), buildCol(2, 3), buildCol(2, 3), buildCol(3)], 5),
    buildRow(5),
  ],
  [
    buildRow(6),
    buildRow([buildCol(4), buildCol(2, 2), buildCol(2, 2), buildCol(4)], 4),
    buildRow(6),
  ],
  [buildRow(6), buildRow(6)],
  [buildRow(5), buildRow(5)],
  [buildRow(5), buildRow(6)],
  [
    buildRow([
      buildCol([buildRow(2), buildRow(2)], 2),
      buildCol(3, 1),
      buildCol([buildRow(2), buildRow(2)], 2),
    ]),
  ],
  [
    buildRow(5),
    buildRow(10),
    buildRow(5),
    buildRow(10, 2),
    buildRow(5),
    buildRow(10),
    buildRow(5),
  ],
  [
    buildRow(2),
    buildRow(2),    
  ],
  [
    buildRow(3),
    buildRow(3),
    buildRow(3),
  ],
  [
    buildRow(4),
    buildRow([buildCol(4), buildCol(3, 3), buildCol(3, 3),buildCol(3, 3), buildCol(4)], 5),
    buildRow(5),
  ],
  [
    buildRow(5,2),
    buildRow([buildCol(1,2),buildCol(1),buildCol(1,2)], 1.4),
    buildRow(5,2),
  ],
  [
    buildRow(8),
    buildRow(8),    
    buildRow(8),    
    buildRow(8),    
  ],
  [
    buildRow(7),
    buildRow(7),    
    buildRow(7),    
    buildRow(7),    
  ],
  [
    buildRow(9),
    buildRow(9),    
    buildRow(9),    
    buildRow(9),    
  ],
  [
    buildRow([
      buildCol(4),
      buildCol([buildRow(2,.85),buildRow(1,2.3),buildRow(2,.85)],2),
      buildCol([buildRow(2),buildRow([buildCol(2)],1.90),buildRow(2)],2),
      buildCol([buildRow(2,.85),buildRow(1,2.3),buildRow(2,.85)],2),
      buildCol(4),
    ])   
  ],
].map((g) => {
  const grid: GridDef = {
    children: g,
    flex: 1,
    id: nanoid(),
  };
  return grid;
});

export function CloneGrid(grid: GridDef): GridDef {
  if (grid.children) {
    const clone: GridDef = {
      id: nanoid(),
      flex: grid.flex,
      children: grid.children.map((g) => CloneGrid(g)),
    };
    return clone;
  }
  const clone: GridDef = {
    id: nanoid(),
    flex: grid.flex,
    cellId: nanoid(),
  };
  return clone;
}

export function GetGridCellIds(grid?: GridDef, ids: string[] = []) {
  if (grid) {
    if (grid.children) {
      grid.children.forEach((g) => GetGridCellIds(g, ids));
    } else {
      ids.push(grid.cellId);
    }
  }
  return ids;
}
