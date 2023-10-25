import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import { FetchAlbums } from "./GooglePhotos";
import { RootState } from "../../app/store";

export interface GoogleAlbum {
  id: string;
  title: string;
  productUrl: string;
  coverPhotoBaseUrl: string;
  coverPhotoMediaItemId: string;
  isWriteable: string;
  mediaItemsCount: string;
}

type ThunkStatus = "idle" | "loading" | "succeeded" | "failed";

const googleAlbumAdapter = createEntityAdapter<GoogleAlbum>();

const googleAlbumSlice = createSlice({
  name: "google_albums",
  initialState: googleAlbumAdapter.getInitialState({
    time: 0,
    status: "idle" as ThunkStatus,
    error: undefined as undefined | string,
  }),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlbums.pending, (state, action) => {
        state.status = "loading";
        state.error = undefined;
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = undefined;
        state.time = Date.now();
        googleAlbumAdapter.upsertMany(state, action.payload);        
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
        state.time = 0;
      });
  },
});

export const fetchAlbums = createAsyncThunk("/google/fetchAlbums", async () => {
  const albumData = await FetchAlbums();
  return albumData.albums;
});


export const googleAlbumReducer = googleAlbumSlice.reducer;

export const {
  selectAll: selectAllGoogleAlbums,    
} = googleAlbumAdapter.getSelectors((state: RootState) => state.google_albums);

export const selectGoogleAlbums = (state: RootState) => state.google_albums;
