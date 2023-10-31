import styles from "./PhotoPool.module.css";
import {
  getPoolPhotoById,
  getSelectedPoolPhoto,
  getUnusedPoolPhotoIds,
  removeImage,
  selectAllPoolPhotos,
  selectImage,
} from "./photoPoolSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import trashIcon from "./trash.svg";
import classNames from "classnames";
import { getSettings } from "../settings/settingsSlice";
import { useEffect, useRef } from "react";

function poolImgId(name: string) {
  return `poolImg-${name}`;
}

type photoSize = "sm" | "md" | "lg";

function PoolPhoto({ name, hide }: { name: string; hide: boolean }) {
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector(getSelectedPoolPhoto)?.id === name;
  const data = useAppSelector((state) => getPoolPhotoById(state, name));

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isSelected && imgRef.current) imgRef.current.scrollIntoView();
  }, [isSelected]);

  function onClick() {
    dispatch(selectImage(name));
  }

  function trashOnClick() {
    dispatch(removeImage(name));
  }

  const border = isSelected ? (
    <div className={styles.poolphoto_border}></div>
  ) : (
    <></>
  );

  const trash = isSelected ? (
    <img
      src={trashIcon}
      className={styles.poolphoto_trash}
      alt="trash"
      onClick={trashOnClick}
    />
  ) : (
    <></>
  );

  const ratio = data ? data.naturalSize.x / data.naturalSize.y : 1;
  let size: photoSize = "lg";
  if (ratio < 1.5) size = "md";
  if (ratio < 1) size = "sm";

  const classes = classNames({
    [styles.poolphoto]: true,
    [styles.hidden]: hide,
    [styles[`poolphoto_${size}`]]: true,
  });

  return (
    <div className={classes}>
      <img
        src={data?.srcUrl}
        style={{ width: "100%" }}
        alt=""
        onClick={onClick}
        id={poolImgId(name)}
        ref={imgRef}
      />
      {trash}
      {border}
    </div>
  );
}

export function getPoolImg(name: string) {
  const elem = document.getElementById(poolImgId(name));
  if (elem instanceof HTMLImageElement) {
    return elem;
  }
  return null;
}

export function PhotoPool() {
  // const photos = useAppSelector(getUnusedPoolPhotos);

  // const images = photos.map((photo) => (
  //   <PoolPhoto key={photo.id} name={photo.id} />
  // ));

  const allPhotos = useAppSelector(selectAllPoolPhotos);
  const displayedIds = useAppSelector(getUnusedPoolPhotoIds);
  const pickerOpen = useAppSelector(getSettings).photoPickerIsOpen;

  if (pickerOpen) return <></>;

  const ids = new Set(displayedIds);
  const images = allPhotos.map((photo) => (
    <PoolPhoto key={photo.id} name={photo.id} hide={!ids.has(photo.id)} />
  ));

  return (
    <div
      id="photo-pool"
      className={styles.photo_pool}
      title={"Click to Select image for placement"}
    >
      {images}
    </div>
  );
}
