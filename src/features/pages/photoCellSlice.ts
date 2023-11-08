import {
  createAction,
  createEntityAdapter,
  createSlice,
  Draft,
  EntityId,
  EntityState,
  PayloadAction,
  Update,
} from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../../app/store";
import {
  getSelectedPoolPhoto,
  getUnusedPoolPhotos,
  PoolPhoto,
  selectAllPoolPhotos,
  selectImage,
} from "../photoPool/photoPoolSlice";
import { GetGridCellIds } from "./gridFuncs";
import {
  AddPageAction,
  ChangeLayoutAction,
  ClearPageAction,
  getCurrentPage,
  getPageById,
} from "./pagesSlice";
import { getSettings } from "../settings/settingsSlice";

export type GridDef = {
  id: string;
  flex: number;
} & (
  | {
      cellId: string;
      children?: never;
    }
  | {
      cellId?: never;
      children: GridDef[];
    }
);

interface PhotoCellData {
  id: string;
  name: string;

  srcH: number;
  srcW: number;
  srcRatio: number;

  dstH: number;
  dstW: number;
  dstRatio: number;
  dstX: number;
  dstY: number;

  minH: number;
  minW: number;

  h: number;
  w: number;
  x: number;
  y: number;
}
function blankPhotoCellData(): PhotoCellData {
  return {
    id: "",
    name: "",

    srcH: 0,
    srcW: 0,
    srcRatio: 0,

    dstH: 0,
    dstW: 0,
    dstRatio: 0,
    dstX: 0,
    dstY: 0,

    minH: 0,
    minW: 0,

    h: 0,
    w: 0,
    x: 0,
    y: 0,
  };
}

type PLACE_IMAGE_TYPE = {
  cellId: string;
  curName: string;
  poolPhoto: PoolPhoto | null;
};

export const PlaceImageAction = createAction<PLACE_IMAGE_TYPE>("PLACE IMAGE");

export const FillPageAction = createAction(
  "FILL PAGE",
  (cellIds: string[], poolPhotos: PoolPhoto[]) => {
    return {
      payload: {
        cellIds: cellIds,
        poolPhotos: poolPhotos,
      },
    };
  }
);

function boundsCheck(cell: Draft<PhotoCellData>) {
  let { x, y } = cell;
  const minX = cell.dstW - cell.w;
  const minY = cell.dstH - cell.h;
  x = Math.max(x, minX);
  x = Math.min(x, 0);
  y = Math.max(y, minY);
  y = Math.min(y, 0);

  cell.x = x;
  cell.y = y;
}

function center(cell: Draft<PhotoCellData>, poolPhoto: PoolPhoto) {
  const faceCenter = poolPhoto?.centerFace || poolPhoto?.aiCenter;
  if (!faceCenter) return;
  let cx = faceCenter.x * cell.w;
  cell.x = cell.dstW / 2 - cx;

  let cy = faceCenter.y * cell.h;
  cell.y = cell.dstH / 2 - cy;

  boundsCheck(cell);
}

function addImageHelper(state: Draft<EntityState<PhotoCellData>>,  cellId: string, poolPhoto: PoolPhoto|null ){
  const cell = state.entities[cellId];
  if (!cell) return;

  if (poolPhoto) {
    cell.name = poolPhoto.id;
    cell.srcH = poolPhoto.naturalSize.y || 0;
    cell.srcW = poolPhoto.naturalSize.x || 0;
    cell.srcRatio = cell.srcW / cell.srcH;

    cell.minH = cell.dstH;
    cell.minW = cell.minH * cell.srcRatio;
    if (cell.dstRatio > cell.srcRatio) {
      cell.minW = cell.dstW;
      cell.minH = cell.minW / cell.srcRatio;
    }
    cell.h = cell.minH;
    cell.w = cell.minW;
    cell.x = 0;
    cell.y = 0;
    center(cell, poolPhoto);
  } else {
    cell.name = "";
  }
}

const photoCellsAdapter = createEntityAdapter<PhotoCellData>();
const photoCellSlice = createSlice({
  name: "photocells",
  initialState: photoCellsAdapter.getInitialState(),
  reducers: {
    moveImage(
      state,
      action: PayloadAction<{
        cellId: string;
        x: number;
        y: number;
      }>
    ) {
      let { cellId, x, y } = action.payload;
      const cell = state.entities[cellId];
      if (!cell) return;
      cell.x = x;
      cell.y = y;
      boundsCheck(cell);
    },
    zoomImage(
      state,
      action: PayloadAction<{
        cellId: string;
        deltaY: number;
        divx: number;
        divy: number;
      }>
    ) {
      let { cellId, deltaY, divx, divy } = action.payload;
      const cell = state.entities[cellId];
      if (!cell || !cell.name) return;
      let x = (divx - cell.x) / cell.w;
      let y = (divy - cell.y) / cell.h;

      let h = (cell.h * (100 + deltaY)) / 100;
      h = Math.max(h, cell.minH);
      cell.h = h;
      cell.w = h * cell.srcRatio;

      x *= cell.w;
      y *= cell.h;
      cell.x = divx - x;
      cell.y = divy - y;

      boundsCheck(cell);
    },
    centerImage(
      state,
      action: PayloadAction<{ cellId: string; poolPhoto: PoolPhoto }>
    ) {
      const cell = state.entities[action.payload.cellId];
      if (!cell) return;
      center(cell, action.payload.poolPhoto);
    },
    setDstRect(
      state,
      action: PayloadAction<{
        cellId: string;
        dstRect: Required<DOMRectInit> | null;
      }>
    ) {
      const { cellId, dstRect } = action.payload;
      const cell = state.entities[cellId];
      if (!cell || !dstRect) return;
      cell.dstH = dstRect.height || 0;
      cell.dstW = dstRect.width || 0;
      cell.dstRatio = cell.dstW / cell.dstH;
      cell.dstX = dstRect.x;
      cell.dstY = dstRect.y;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PlaceImageAction, (state, action) => {
        const { cellId, poolPhoto } = action.payload;
        addImageHelper(state,cellId,poolPhoto);
      })
      .addCase(AddPageAction, (state, action) => {
        const cellIds = GetGridCellIds(action.payload.grid);
        cellIds.forEach((id) =>
          photoCellsAdapter.addOne(state, {
            ...blankPhotoCellData(),
            id: id,
          })
        );
      })
      .addCase(ChangeLayoutAction, (state, action) => {
        photoCellsAdapter.removeMany(
          state,
          GetGridCellIds(action.payload.oldGrid)
        );
        const cellIds = GetGridCellIds(action.payload.newGrid);
        cellIds.forEach((id) =>
          photoCellsAdapter.addOne(state, {
            ...blankPhotoCellData(),
            id: id,
          })
        );
      })
      .addCase(ClearPageAction, (state, action) => {
        const cellIds = GetGridCellIds(action.payload.page.grid);
        if (action.payload.deletePage) {
          photoCellsAdapter.removeMany(state, cellIds);
        } else {
          const updates: readonly Update<PhotoCellData>[] = cellIds.map(
            (id) => ({
              id: id,
              changes: {
                name: "",
              },
            })
          );
          photoCellsAdapter.updateMany(state, updates);
        }
      })
      .addCase(FillPageAction, (state,action)=>{
        const {cellIds, poolPhotos} = action.payload;
        cellIds.forEach((cellId,idx)=> addImageHelper(state,cellId,poolPhotos[idx]))
      })
      ;
  },
});

export const { moveImage, zoomImage, centerImage, setDstRect } =
  photoCellSlice.actions;

export const placeImage =
  ({ cellId }: { cellId: string }): AppThunk =>
  (dispatch, getState) => {
    const cell = getPhotoCellById(getState(), cellId);
    const selectedPoolPhoto = getSelectedPoolPhoto(getState());

    if (!cell || !selectedPoolPhoto) return;

    dispatch(
      PlaceImageAction({
        cellId: cellId,
        curName: cell.name,
        poolPhoto: selectedPoolPhoto,
      })
    );
    if (cell.name){
      dispatch(selectImage(cell.name));
    }
  };

export const removeImage =
  ({ cellId }: { cellId: string }): AppThunk =>
  (dispatch, getState) => {
    const cell = getPhotoCellById(getState(), cellId);
    if (!cell) return;
    const name = cell.name;
    dispatch(
      PlaceImageAction({
        cellId: cellId,
        curName: cell.name,
        poolPhoto: null,
      })
    );
    if (name){
      dispatch(selectImage(name));
    }
  };

export const fillPage = (): AppThunk => (dispatch, getState) => {
  const page = getCurrentPage(getState());
  if (!page) return;
  const emptyCellIds = selectAllCellsOnPage(getState(), page.id)
    .filter((cell) => !!cell && cell.name === "")
    .map((cell) => cell?.id) as string[];

  const pool = getUnusedPoolPhotos(getState());
  let toPlace = pool;
  if (pool.length > emptyCellIds.length) {
    const set = new Set<number>();
    while (set.size < emptyCellIds.length) {
      set.add(Math.floor(Math.random() * pool.length));
    }
    toPlace = [];
    set.forEach((idx) => toPlace.push(pool[idx]));
  }
  dispatch(FillPageAction(emptyCellIds, toPlace));
};

export const [photocellReducer] = [photoCellSlice.reducer];

export const { selectById: getPhotoCellById, selectAll: getAllPhotoCells } = photoCellsAdapter.getSelectors(
  (state: RootState) => state.photocells
);
export function cellIsEmptyById(state: RootState, id: string) {
  const cell = getPhotoCellById(state, id);
  if (!cell) return true;
  if (cell.name === "") return true;
  return false;
}

export const selectAllCellsOnPage = (state: RootState, pageId: EntityId) => {
  return GetGridCellIds(getPageById(state, pageId)?.grid).map((id) =>
    getPhotoCellById(state, id)
  );
};


export const fillAll = (): AppThunk => (dispatch, getState) => {  
  const used = new Set<string>();
  const emptyCells = getAllPhotoCells(getState()).filter(cell=>cell.name==="");
  const photos = selectAllPoolPhotos(getState()).filter(photo=>!photo.used);
  emptyCells.sort((a,b)=>(b.dstW*b.dstH - a.dstW*a.dstH));
  photos.sort((a,b)=>(b.rating - a.rating));

  const ratioRange = getSettings(getState()).fillRange;
  const [minRatio, maxRatio] = [1-ratioRange,1+ratioRange];
  
  let cellIds:string[] = [];
  let photosToPlace:PoolPhoto[]=[];

  emptyCells.forEach(cell=>{
    for( let p of photos){
      if (used.has(p.id)) continue;
      const pRatio = p.naturalSize.x/p.naturalSize.y;
      const ratio = (pRatio/cell.dstRatio);
      if (ratio <minRatio || ratio > maxRatio) continue;
      used.add(p.id);
      cellIds.push(cell.id);
      photosToPlace.push(p);
      break;
    }
  })
  dispatch(FillPageAction(cellIds,photosToPlace));
};