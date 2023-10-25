import {
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
  Update,
} from "@reduxjs/toolkit";
import {  RootState } from "../../app/store";
import { FillPageAction, PlaceImageAction } from "../pages/photoCellSlice";
import { ClearPageAction } from "../pages/pagesSlice";
import { ImportAction } from "../undo";
import { ObjectDetectionPrediction } from "@visheratin/web-ai";
import { blobUrlMap } from "./photoPoolFuncs";

export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}
export interface Point {
  x: number;
  y: number;
}

export interface PoolPhoto {
  id: string;
  naturalSize: Point;
  rating: number;
  used: boolean;
  srcUrl: string;
  
  faces: Box[];
  centerFace?: Point;  
  
  webai?: ObjectDetectionPrediction[] | undefined;
  aiCenter?: Point;
  aiRating?: number;
}
export function getEmptyPoolPhoto(): PoolPhoto {
  return {
    id: "",
    faces: [] as Box[],
    naturalSize: { x: 0, y: 0 },
    rating: 0,
    used: false,
    srcUrl: "",
  };
}

export const AllRatings = -1;

const photoPoolAdapter = createEntityAdapter<PoolPhoto>();

const photoPoolSlice = createSlice({
  name: "photopool",
  initialState: photoPoolAdapter.getInitialState({
    selectedPhoto: null as null | string,
    message: null as null | string,
    ratingFilter: AllRatings,
    ObjectFilter: "",
  }),
  reducers: {
    addImage(state, action: PayloadAction<{ photo: PoolPhoto }>) {
      photoPoolAdapter.upsertOne(state, action.payload.photo);
    },
    updatePhoto(
      state,
      action: PayloadAction<Partial<PoolPhoto> & { id: string }>
    ) {
      photoPoolAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload,
      });
    },
    selectImage(state, action: PayloadAction<string | null>) {
      let imgName = action.payload;
      if (state.selectedPhoto === imgName) imgName = null;
      state.selectedPhoto = imgName;
      state.message = null;
    },
    removeImage(state, action: PayloadAction<string>) {
      photoPoolAdapter.removeOne(state, action.payload);
      emptyRatingFilterSetHelper(state);
    },
    rateImage(state, action: PayloadAction<number>) {
      if (!state.selectedPhoto) return;
      //Update rating
      photoPoolAdapter.updateOne(state, {
        id: state.selectedPhoto,
        changes: {
          rating: action.payload,
        },
      });
      // Select next unrated photo
      for (let name of state.ids){        
        if (
          (state.entities[name]?.webai) &&
          !state.entities[name]?.used &&
          (state.entities[name]?.rating === undefined ||
            state.entities[name]?.rating === 0)
        ) {
          state.selectedPhoto = name as string;
          break;
        }
      }
      emptyRatingFilterSetHelper(state);
    },
    filterByRating(state, action: PayloadAction<number>) {
      state.ratingFilter = action.payload;
    },
    filterByObject(state, action: PayloadAction<string>) {
      state.ObjectFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(PlaceImageAction, (state, action) => {
        const { curName, poolPhoto } = action.payload;
        state.selectedPhoto = null;
        photoPoolAdapter.updateOne(state, {
          id: curName,
          changes: { used: false },
        });
        if (poolPhoto) {
          photoPoolAdapter.updateOne(state, {
            id: poolPhoto.id,
            changes: { used: true },
          });
        }
        emptyRatingFilterSetHelper(state);
      })
      .addCase(ClearPageAction, (state, action) => {
        const photos = action.payload.photos;
        const updates: readonly Update<PoolPhoto>[] = photos.map((name) => ({
          id: name,
          changes: {
            used: false,
          },
        }));
        photoPoolAdapter.updateMany(state, updates);
      })
      .addCase(FillPageAction, (state, action) => {
        const photos = action.payload.poolPhotos;
        const updates: readonly Update<PoolPhoto>[] = photos.map(
          (poolPhoto) => ({
            id: poolPhoto.id,
            changes: {
              used: true,
            },
          })
        );
        photoPoolAdapter.updateMany(state, updates);
        emptyRatingFilterSetHelper(state);
      })
      .addCase(ImportAction, (state, action) => {
        // The exported objectURLs will no longer be valid.
        // So either the image was already loaded and the url is in the map,
        // or the image is missing, so the url should be cleared and the name
        // added to the missing list.
        let msg = "";        
        state.ids.forEach((n) => {
          const name = n as string; 
          const url = blobUrlMap.get(name) || "";
          photoPoolAdapter.updateOne(state,{
            id: n,
            changes:{
              srcUrl: url
            }
          });
          if (url ===""){
            msg += `missing ${name}\n`;
          }
        });
        state.selectedPhoto = null;
        state.message = msg;
      });
  },
});

export const {
  addImage,
  updatePhoto,
  selectImage,
  removeImage,
  rateImage,
  filterByRating,
  filterByObject,
} = photoPoolSlice.actions;
export const {
  selectById: getPoolPhotoById,
  selectIds: getPoolPhotoIds,
  selectAll: selectAllPoolPhotos,  
  selectEntities: selectPoolPhotoEntities,
} = photoPoolAdapter.getSelectors((state: RootState) => state.photopool);
export const [photoPoolReducer] = [photoPoolSlice.reducer];

export const getUnusedPoolPhotos = createSelector(
  [
    (state: RootState) => state.photopool.ratingFilter,
    (state: RootState) => state.photopool.ObjectFilter,
    selectAllPoolPhotos,
  ],
  (rating, object, poolPhotos) =>
    poolPhotos
      .filter(
        (photo) =>
          photo.used === false && photo.webai &&
          (rating === AllRatings || photo.rating === rating)
      )
      .filter(
        (photo) =>
          object === "" ||
          photo.webai?.some((obj) => obj.class === object) ||
          (object === "none" && (!photo.webai || photo.webai.length === 0))
      )
);

export const getUnusedPoolPhotoIds = createSelector([getUnusedPoolPhotos],(photos)=>{
  return photos.map(p=>p.id);
});

export const getPhotoRatingsSet = createSelector(
  [selectAllPoolPhotos],
  (poolPhotos) => {
    let s = new Set<number>();
    poolPhotos.forEach((photo) => {
      if (!photo.used && photo.rating !== null) s.add(photo.rating);
    });
    return Array.from(s).sort();
  }
);

function emptyRatingFilterSetHelper(
  state: ReturnType<typeof photoPoolSlice.reducer>
) {
  // Reset the ratign filter to AllRatings if there
  // are no pictures left after filling.
  if (
    state.ids
      .map((id) => state.entities[id])
      .filter(
        (photo) => photo && !photo.used && photo.rating === state.ratingFilter
      ).length === 0
  )
    state.ratingFilter = AllRatings;
}

export const getSelectedPoolPhoto = (state: RootState) =>
  getPoolPhotoById(state, state.photopool.selectedPhoto || "");

export const getMessage = (state: RootState): null | string =>
  state.photopool.message;

export const getRatingFilter = (state: RootState) =>
  state.photopool.ratingFilter;

export const getObjectFilter = (state: RootState) =>
  state.photopool.ObjectFilter;
export const getAllWebAiClasses = createSelector(
  [selectAllPoolPhotos],
  (poolPhotos) => {
    let s = new Set<string>();
    poolPhotos.forEach((p) => p.webai?.forEach((o) => s.add(o.class)));
    return Array.from(s).sort();
  }
);
