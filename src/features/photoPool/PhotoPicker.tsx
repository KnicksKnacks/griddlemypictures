import styles from "./PhotoPool.module.css";
import { getPoolPhotoById, getSelectedPoolPhoto, getUnusedPoolPhotoIds, removeImage, selectAllPoolPhotos, selectImage } from "./photoPoolSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import trashIcon from './trash.svg'
import classNames from "classnames";

function poolImgId(name: string) {
  return `poolImg-${name}`;
}

function PoolPhoto({ name, hide}: { name: string, hide:boolean }) {
  const dispatch = useAppDispatch();
  const isSelected = useAppSelector(getSelectedPoolPhoto)?.id===name

  const data = useAppSelector(state=>getPoolPhotoById(state,name));  

  function onClick() {
    dispatch(selectImage(name));
  }

  function trashOnClick(){
    dispatch(removeImage(name));
  }

  const border = isSelected ? 
  ( <div className={styles.poolphoto_border}></div> ) : (<></>)

  const trash = isSelected ? 
  ( <img src={trashIcon} className={styles.poolphoto_trash} alt="trash" onClick={trashOnClick}/> ) : (<></>)

  const classes = classNames({
    [styles.poolphoto]:true,
    [styles.hidden]: hide
     })

  return (
    <div className={classes}>
    <img
      src={data?.srcUrl}
      className={styles.poolphoto}
      alt=""
      onClick={onClick}      
      id={poolImgId(name)}
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

export function PhotoPicker() {

  const allPhotos = useAppSelector(selectAllPoolPhotos);
  const displayedIds = useAppSelector(getUnusedPoolPhotoIds);

  const ids = new Set(displayedIds);
  const images = allPhotos.map((photo) => (
      <PoolPhoto key={photo.id} name={photo.id} hide={!ids.has(photo.id)}/>
  ));

  return <div id="photo-pool" className={styles.photo_picker} title={"Click to Select image for placement"}>{images}</div>;
}
