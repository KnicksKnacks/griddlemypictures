import { configureStore, ThunkAction, Action, combineReducers, EntityState } from '@reduxjs/toolkit';
import localforage from 'localforage';
import persistReducer from 'redux-persist/es/persistReducer';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, createTransform } from 'redux-persist';
import {photocellReducer} from '../features/pages/photoCellSlice'
import { PoolPhoto, photoPoolReducer } from '../features/photoPool/photoPoolSlice';
import persistStore from 'redux-persist/es/persistStore';
import { pagesReducer } from '../features/pages/pagesSlice';
import { settingsReducer } from '../features/settings/settingsSlice';
import { undoReducer } from '../features/undo';
import autoMergeLevel1 from 'redux-persist/es/stateReconciler/autoMergeLevel1';
import { googleAlbumReducer } from '../features/googlePhotos/googleAlbumsSlice';
import { photoPickerMiddleware } from '../features/photoPool/PhotoPicker';



const rootReducer = undoReducer(combineReducers({
  photocells: photocellReducer,
  photopool: photoPoolReducer,
  pages: pagesReducer,
  settings: settingsReducer,
  google_albums: googleAlbumReducer
}))


// Clear all of the now-invalid objectURLs that were
// stored as the src of the image.
const objectUrlTransform= createTransform(
  (inbound,key) =>{
    return inbound;
  },
  (outbound,key) =>{     
    for (let v of  Object.values((outbound as EntityState<PoolPhoto>).entities)){
      if (v?.srcUrl) v.srcUrl="";
    }
    return outbound;
  },
  {
    whitelist: ['photopool']
  }
)

// Don't store the undo stack, need to use autoMerge to 
// allow the default undo stack to be created each time.
// Otherwise the stack won't exist after rehydrating.
const persistConfig = {
  key: 'root',
  storage: localforage,
  stateReconciler: autoMergeLevel1,
  blacklist: ['_undo'],
  transforms: [objectUrlTransform]
}

// https://github.com/rt2zz/redux-persist/issues/1373#issuecomment-1085091744
const persistedReducer = persistReducer(persistConfig, rootReducer as any) as unknown as typeof rootReducer



// had an error in console :A non-serializable value was detected in an action, in the path: `register`
// added fix from here
// https://github.com/rt2zz/redux-persist/issues/988#issuecomment-552242978
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    }
  }).concat(photoPickerMiddleware)
});


const persistor = persistStore(store)

export {store, persistor}

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
