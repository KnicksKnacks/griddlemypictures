import {
  EntityId,
  createAction,
  createEntityAdapter,
  createSelector,
  createSlice,
  nanoid,
} from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../../app/store";
import { CloneGrid, GetGridCellIds } from "./gridFuncs";
import {
  GridDef,
  cellIsEmptyById,
  getAllPhotoCells,
  getPhotoCellById,
  selectAllCellsOnPage,
} from "./photoCellSlice";

interface Page {
  id: string;
  grid: GridDef;
}

export const AddPageAction = createAction<Page>("ADD PAGE");
export const ChangePageAction = createAction<Page>("CHANGE PAGE");

export const ClearPageAction = createAction(
  "CLEAR PAGE",
  (page: Page, photos: string[], deletePage: boolean) => {
    return {
      payload: {
        page: page,
        photos: photos,
        deletePage: deletePage,
      },
    };
  }
);

type ChangeLayoutType = {
  oldGrid: GridDef;
  newGrid: GridDef;
};
export const ChangeLayoutAction =
  createAction<ChangeLayoutType>("CHANGE LAYOUT");

const pagesAdapter = createEntityAdapter<Page>();
const pagesSlice = createSlice({
  name: "pages",
  initialState: pagesAdapter.getInitialState({
    currentPage: "" as EntityId,
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(ChangePageAction, (state, action) => {
        state.currentPage = action.payload.id;
      })
      .addCase(ChangeLayoutAction, (state, action) => {
        const cur = state.entities[state.currentPage];
        if (cur) cur.grid = action.payload.newGrid;
      })
      .addCase(AddPageAction, (state, action) => {
        pagesAdapter.addOne(state, action.payload);
        state.currentPage = state.ids[state.ids.length - 1];
      })
      .addCase(ClearPageAction, (state, action) => {
        if (action.payload.deletePage) {
          const { id } = action.payload.page;
          let idx = state.ids.indexOf(id);
          pagesAdapter.removeOne(state, id);
          if (idx >= state.ids.length) idx--;
          if (idx >= 0) state.currentPage = state.ids[idx];
          else state.currentPage = "";
        }
      });
  },
});

export const pagesReducer = pagesSlice.reducer;

export const getCurrentPage = (state: RootState) => {
  return state.pages.entities[state.pages.currentPage];
};

export const getCurrentPageNumber = (state: RootState) => {
  return state.pages.ids.indexOf(state.pages.currentPage) + 1 ;
};

export const getPageList = (state: RootState) => {
  return state.pages.ids;
};

export const { selectById: getPageById, selectTotal: getPageCount, selectAll: getAllPages } =
  pagesAdapter.getSelectors((state: RootState) => state.pages);

const isNonEmptyName = (name: string | undefined): name is string => {
  return !!name && name !== "";
};
export const getPhotoNamesOnPage = createSelector(
  [(state, pageId) => selectAllCellsOnPage(state, pageId)],
  (allCells) => allCells.map((cell) => cell?.name).filter(isNonEmptyName)
);

export const gridSelectionClick =
  (grid: GridDef, e: React.MouseEvent): AppThunk =>
  (dispatch, getState) => {
    const g = CloneGrid(grid);
    const page = getCurrentPage(getState());
    const newPage = {
      grid: g,
      id: nanoid(),
    };
    if (!page||e.shiftKey) {
      dispatch(AddPageAction(newPage));
    } else {
      let curCellIds = GetGridCellIds(page.grid);
      if (curCellIds.every((id) => cellIsEmptyById(getState(), id))) {
        dispatch(
          ChangeLayoutAction({
            newGrid: g,
            oldGrid: page.grid,
          })
        );
      } else {
        dispatch(AddPageAction(newPage));
      }
    }
  };

export const changePage =
  (pageId: EntityId): AppThunk =>
  (dispatch, getState) => {
    const page = getPageById(getState(), pageId);
    if (page) dispatch(ChangePageAction(page));
  };

const clearPageHelper =
  (deletePage: boolean): AppThunk =>
  (dispatch, getState) => {
    const page = getCurrentPage(getState());
    if (!page) return;
    
    const photos = getPhotoNamesOnPage(getState(),page.id)

    dispatch(ClearPageAction(page, photos, deletePage));
  };
export const clearPage = (): AppThunk => (dispatch, getState) => {
  dispatch(clearPageHelper(false));
};

export const deletePage = (): AppThunk => (dispatch, getState) => {
  dispatch(clearPageHelper(true));
};


export const hasUnfilledPages = createSelector(
  [(state)=> getAllPhotoCells(state)],
  (allCells) => {
    return allCells.some(cell=> cell.name==="");
  }
);

export const showUnfilledPage = (): AppThunk => (dispatch, getState) => {
  for (let page of getAllPages(getState())){
    GetGridCellIds(page.grid).forEach(cellId =>{
      const cell = getPhotoCellById(getState(),cellId)
      if (cell && cell.name===""){
        dispatch(ChangePageAction(page));
        return;
      }
    })
  }
};
