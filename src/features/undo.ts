import { AnyAction, Reducer, createAction } from "@reduxjs/toolkit";
import {
  PlaceImageAction,
  moveImage,
  centerImage,
  zoomImage,
  FillPageAction,
} from "./pages/photoCellSlice";
import { AddPageAction, ClearPageAction } from "./pages/pagesSlice";
import { RootState } from "../app/store";
import { ClearAllPhotoData } from "./photoPool/photoPoolFuncs";

type undoType<S> = {
  past: S[];
  future: S[];
  lastAction: AnyAction;
};
type WithUndo<S> = S & { _undo: undoType<S> };

function getEmptyAnyAction(): AnyAction {
  return {
    type: null,
    extraProps: "",
  };
}
function getEmptyUndo<S>(): undoType<S> {
  return {
    past: [],
    future: [],
    lastAction: getEmptyAnyAction(),
  };
}

export const UndoAction = createAction("UNDO");
export const RedoAction = createAction("REDO");
export const ImportAction = createAction<Partial<RootState>>("IMPORT");
export const ClearAllAction = createAction("CLEARALL");

// Only store the first image manipulation action done to a cell
// https://redux-toolkit.js.org/api/createaction/#as-a-typescript-type-guard
// The type checking here is interesting!
function chkPtCellAction(action: AnyAction, lastAction: AnyAction) {
  let cellId, lastCellId;
  if (
    moveImage.match(action) ||
    centerImage.match(action) ||
    zoomImage.match(action)
  ) {
    cellId = action.payload.cellId;
  } else return false;

  if (
    moveImage.match(lastAction) ||
    centerImage.match(lastAction) ||
    zoomImage.match(lastAction)
  ) {
    lastCellId = lastAction.payload.cellId;
  } else return true;
  return cellId !== lastCellId;
}

function chkPtPageClear(action: AnyAction, lastAction: AnyAction) {
  if (!ClearPageAction.match(action)) return false;
  if (!ClearPageAction.match(lastAction)) return true;
  if (action.payload.deletePage) return true;
  return action.payload.page.id !== lastAction.payload.page.id;
}

// This was heavily based on the redux-persist reducer code
// https://github.com/rt2zz/redux-persist/blob/master/src/persistReducer.ts
export function undoReducer<S extends Object>(
  reducer: Reducer<S, AnyAction>
): Reducer<WithUndo<S>, AnyAction> {
  return (state: WithUndo<S> | undefined, action: AnyAction) => {
    const { _undo, ...rest } = state ? state : { _undo: undefined };

    const restState = Object.keys(rest).length === 0 ? undefined : (rest as S);
    let undoState = _undo || getEmptyUndo<S>();

    if (UndoAction.match(action)) {
      undoState = (JSON.parse(JSON.stringify(_undo)) as undoType<S>);
      const last = undoState.past.pop();
      if (last && restState) {
        undoState.future.push(restState);
        undoState.lastAction = getEmptyAnyAction();
        return {
          ...reducer(last, action),
          _undo: undoState,
        };
      }
    }
    if (RedoAction.match(action)) {
      undoState = (JSON.parse(JSON.stringify(_undo)) as undoType<S>);
      const next = undoState.future.pop();
      if (next && restState) {
        undoState.past.push(restState);
        undoState.lastAction = getEmptyAnyAction();
        return {
          ...reducer(next, action),
          _undo: undoState,
        };
      }
    }

    if (ImportAction.match(action)){
      const importState = action.payload;
      const nextState = {
        ...restState
      } as S;
      Object.assign(nextState,importState)
      return {
        ...reducer(nextState,action),
        _undo: getEmptyUndo<S>()
      }
    }

    if (ClearAllAction.match(action)){            
      ClearAllPhotoData();
      return {
        ...reducer(undefined, action),
        _undo: getEmptyUndo<S>()
      }
    }

    // All tests for an undoable action
    const tests: boolean[] = [
      PlaceImageAction.match(action),
      AddPageAction.match(action),
      FillPageAction.match(action),
      chkPtCellAction(action, undoState.lastAction),
      chkPtPageClear(action, undoState.lastAction),
    ];

    // Determine if any test was true and if so, push the current state (before performing the action).
    // Store the action itselt too, so that some repeated actions (zomm etc) may be ignored.
    if (tests.reduce((prev, cur) => prev || cur) && restState) {
      undoState = (JSON.parse(JSON.stringify(_undo)) as undoType<S>);
      undoState.lastAction = action;
      undoState.past.push(restState);
      undoState.future = [];
    }

    return {
      ...reducer(restState, action),
      _undo: undoState,
    };
  };
}

export const undoAactive = (state: RootState) => {
  return state._undo.past.length > 0;
};

export const redoAactive = (state: RootState) => {
  return state._undo.future.length > 0;
};

export const getExportState = (state: RootState) => {
  return Object.fromEntries(
    Object.entries(state).filter(
      ([key]) => typeof key === "string" && key !== "_undo" && key !== "_persist"
    )
  );
};
