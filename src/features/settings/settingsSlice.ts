import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export type GoogleToken = null | {
  key: string;
  time: number;
};

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    widthInches: 11,
    heightInches: 8.5,
    ppi: 300,
    color: "white",
    fillRange: 0.25,
    googleToken: null as GoogleToken,
    loadingProgress: 1
  },
  reducers: {
    setColor(state, action: PayloadAction<string>) {
      state.color = action.payload;
    },
    setWidthInches(state, action: PayloadAction<number>) {
      state.widthInches = action.payload;
    },
    setHeightInches(state, action: PayloadAction<number>) {
      state.heightInches = action.payload;
    },
    setResolution(state, action: PayloadAction<number>) {
      state.ppi = action.payload;
    },
    setFillRange(state, action: PayloadAction<number>) {
      state.fillRange = action.payload;
    },
    setGoogleToken(state, action: PayloadAction<GoogleToken>) {
      state.googleToken = action.payload;
    },
    setLoadingProgress(state, action: PayloadAction<number>) {
      state.loadingProgress = action.payload;
    },
  },
});

export const [settingsReducer] = [settingsSlice.reducer];

export const {
  setColor,
  setHeightInches,
  setWidthInches,
  setResolution,
  setFillRange,
  setGoogleToken,
  setLoadingProgress
} = settingsSlice.actions;
export function getSettings(state: RootState) {
  return state.settings;
}
