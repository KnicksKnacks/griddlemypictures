import { useEffect, useState } from "react";
import { store } from "../../app/store";
import { getSettings, setGoogleToken } from "../settings/settingsSlice";
import ReactModal from "react-modal";
import {
  GoogleAlbum,
  fetchAlbums,
  selectAllGoogleAlbums,
  selectGoogleAlbums,
} from "./googleAlbumsSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { MediaItem } from "./GooglePhotosTypes";
import { LoadUrls } from "./photoPoolFuncs";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import CloseIcon from "@mui/icons-material/Close";
import styles from "./GooglePhotos.module.css";

export const googlePhotosConfig = {
  client_id:
    "",
  scope: "https://www.googleapis.com/auth/photoslibrary.readonly",
  endpoint: "https://photoslibrary.googleapis.com",
  proxy: "",
};

// I think this is the implicit grant model
// https://developers.google.com/identity/oauth2/web/guides/use-token-model
// This is for authorization

// The google api client is not bundled for node,
// So I include the script in the index.html
// and use this declaration to quell typescript.
declare const google: any;

type voidCallBack = () => void;

async function GetGooglePhotosToken(): Promise<string> {
  let result = new Promise<string>((resolve, reject) => {
    let cachedToken = getSettings(store.getState()).googleToken;
    if (
      cachedToken &&
      cachedToken.key &&
      cachedToken.time &&
      cachedToken.time > Date.now()
    ) {
      return resolve(cachedToken.key);
    }
    const client = google.accounts.oauth2.initTokenClient({
      client_id: googlePhotosConfig.client_id,
      scope: googlePhotosConfig.scope,
      callback: (tokenResponse: any) => {
        if (!tokenResponse || !tokenResponse.access_token)
          return reject("requestAccessToken error");
        let data = {
          key: tokenResponse.access_token,
          time: Date.now() + 1000 * (tokenResponse.expires_in - 300),
        };
        store.dispatch(setGoogleToken(data));
        return resolve(data.key);
      },
    });
    client.requestAccessToken();
  });

  return result;
}

async function albumClick(id: string, close: voidCallBack) {
  const pics = await getAlbumPics(id);
  LoadUrls(pics);
  close();
}

function RefreshIcon({
  IsRefreshing,
  click,
}: {
  IsRefreshing: boolean;
  click: voidCallBack;
}) {
  function refreshClick() {
    if (!IsRefreshing) click();
  }
  return (
    <AutorenewIcon
      fontSize="inherit"
      className={IsRefreshing ? styles.spin : ""}
      onClick={refreshClick}
    ></AutorenewIcon>
  );
}

function AlbumSelect({ close }: { close: voidCallBack }) {
  const dispatch = useAppDispatch();
  const googleAlbums = useAppSelector(selectGoogleAlbums);

  useEffect(() => {
    if (Date.now() - googleAlbums.time > 5 * 60 * 1000) dispatch(fetchAlbums());
  }, [dispatch, googleAlbums.time]);

  const albums = useAppSelector(selectAllGoogleAlbums);

  const albumIcons = albums.map((album) => (
    <div
      className={styles.albumCard}
      key={album.id}
      onClick={() => albumClick(album.id, close)}
    >
      <h3>{album.title}</h3>
      <img src={album.coverPhotoBaseUrl + "=w150-h150"} alt={album.title}></img>
    </div>
  ));

  return (
    <div className={styles.albumDisplay}>
      <div className={styles.titleBar}>
        <div className={styles.leftAlign}>
          Albums{" "}
          <RefreshIcon
            IsRefreshing={googleAlbums.status === "loading"}
            click={() => dispatch(fetchAlbums())}
          />
        </div>
        <div className={styles.rightAlign}>
          <CloseIcon fontSize="inherit" onClick={close} />
        </div>
      </div>
      <div className={styles.albumContainer}>{albumIcons}</div>
    </div>
  );
}

export function LinkGooglePhotos() {
  const [popUp, setPopUp] = useState(false);
  const openPopup = () => setPopUp(true);
  const closePopup = () => setPopUp(false);

  return (
    <>
      <button
        onClick={() => {
          GetGooglePhotosToken();
          openPopup();
        }}
      >
        Link GooglePhotos
      </button>
      <ReactModal
        isOpen={popUp}
        onRequestClose={closePopup}
        contentLabel="Albums"
        className={styles.albumModal}
      >
        <AlbumSelect close={closePopup} />
      </ReactModal>
    </>
  );
}

ReactModal.setAppElement("#root");

export const FetchAlbums = async () => {
  let albums: GoogleAlbum[] = [];
  let error: null | any = null;

  let parameters = new URLSearchParams();

  try {
    // Loop while there is a nextpageToken property in the response until all
    // albums have been listed.
    do {
      // Make a GET request to load the albums with optional parameters (the
      // pageToken if set).
      const albumResponse = await fetch(
        googlePhotosConfig.endpoint + "/v1/albums?" + parameters,
        {
          method: "get",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + (await GetGooglePhotosToken()),
          },
        }
      );

      const result = await checkStatus(albumResponse);

      if (result && result.albums) {
        // Parse albums and add them to the list, skipping empty entries.
        const items = result.albums.filter((x: any) => !!x);

        albums = albums.concat(items);
      }
      if (result.nextPageToken) {
        parameters.set("pageToken", result.nextPageToken);
      } else {
        parameters.delete("pageToken");
      }

      // Loop until all albums have been listed and no new nextPageToken is
      // returned.
    } while (parameters.has("pageToken"));
  } catch (err) {
    // Log the error and prepare to return it.
    error = err;
    console.error(error);
  }

  return { albums, error };
};

// Return the body as JSON if the request was successful, or thrown a StatusError.
async function checkStatus(response: any) {
  if (!response.ok) {
    // Throw a StatusError if a non-OK HTTP status was returned.
    let message = "";
    try {
      // Try to parse the response body as JSON, in case the server returned a useful response.
      message = await response.json();
    } catch (err) {
      // Ignore if no JSON payload was retrieved and use the status text instead.
    }
    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        message,
      })
    );
  }

  // If the HTTP status is OK, return the body as JSON.
  return await response.json();
}

export async function getAlbumPics(albumId: string, height = 200, width = 500) {
  const parameters = { albumId } as {
    albumId: string;
    pageToken?: string;
  };
  let photos = [] as MediaItem[];

  const token = await GetGooglePhotosToken();

  do {
    // Make a POST request to search the library or album
    const searchResponse = await fetch(
      googlePhotosConfig.endpoint + "/v1/mediaItems:search",
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(parameters),
      }
    );

    if (!searchResponse.ok) {
      console.log(searchResponse);
      break;
    }
    const result = await searchResponse.json();

    // The list of media items returned may be sparse and contain missing
    // elements. Remove all invalid elements.
    // Also remove all elements that are not images by checking its mime type.
    // Media type filters can't be applied if an album is loaded, so an extra
    // filter step is required here to ensure that only images are returned.
    const items =
      result && result.mediaItems
        ? result.mediaItems
            .filter((x: any) => x) // Filter empty or invalid items.
            // Only keep media items with an image mime type.
            .filter((x: any) => x.mimeType && x.mimeType.startsWith("image/"))
        : [];

    photos = photos.concat(items);

    // Set the pageToken for the next request.
    parameters.pageToken = result.nextPageToken;

    console.log(
      `Found ${items.length} images in this request. Total images: ${photos.length}`
    );

    // Loop until the required number of photos has been loaded or until there
    // are no more photos, ie. there is no pageToken.
  } while (parameters.pageToken != null);

  const urls = photos.map((mediaItem) => ({
    thumb: mediaItem.baseUrl + `=w${width}-h${height}`,
    fullsize:
      mediaItem.baseUrl +
      `=w${mediaItem.mediaMetadata.width}-h${mediaItem.mediaMetadata.height}`,
    img500: mediaItem.baseUrl + `=w500-h500`,
    ...mediaItem,
  }));
  return urls;
}
