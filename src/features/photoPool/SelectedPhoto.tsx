import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  getMessage,
  getSelectedPoolPhoto,
  rateImage,
  removeImage,
  selectImage,
} from "./photoPoolSlice";
import styles from "./PhotoPool.module.css";
import { useEffect, useRef } from "react";
import trashIcon from './trash.svg'

export function SelectedPhoto() {
  const dispatch = useAppDispatch();
  const selectedPhoto = useAppSelector(getSelectedPoolPhoto);
  const message = useAppSelector(getMessage);

  const containerElem = useRef<HTMLDivElement>(null);

  function onClick() {
    dispatch(selectImage(null));  
  }
  
  function trashOnClick(){
    const name = selectedPhoto?.id;
    if (name)
      dispatch(removeImage(name));
  }

  useEffect(() => {
    function key(e: KeyboardEvent) {
      let val = parseInt(e.key);
      if (!isNaN(val)) {
        dispatch(rateImage(val));
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
    };
  },[dispatch]);

  let child = <></>;
  if (message) {
    const formattedMessage = message
      .split("\n")
      .map((msg, idx) => <li key={idx}>{msg}</li>);
    child = <p>{formattedMessage}</p>;
  } else if (selectedPhoto) {
    let imgClass = styles.selected_photo_byHeight;
    let imgAspect = selectedPhoto.naturalSize.x/ selectedPhoto.naturalSize.y;
    let containerAspect = 1;
    if (containerElem.current){
      containerAspect = containerElem.current.offsetWidth / containerElem.current.offsetHeight;
    }
    if (imgAspect>containerAspect){
      imgClass = styles.selected_photo_byWidth;    
    }
    
    child = (<>
    <div className={styles.select_photo_controls}>
      {selectedPhoto.rating} 
      <button onClick={trashOnClick}><img src={trashIcon} style={{height:'1.2em'}} alt="trash"/></button>
      </div>
    <div className={styles.selected_photo_overlay_wrapper}>
      <canvas className={styles.selected_photo_overlay}></canvas>
      <img src={selectedPhoto.srcUrl} className={imgClass} alt="" onClick={onClick} title={"Click To Unselect\nPress Number Key To Rate Image"}></img>
    </div>
    </>);
  }

  return (
    <div
      className={styles.selected_photo_area}
      ref={containerElem}
    >
      {child}
    </div>
  );
}
