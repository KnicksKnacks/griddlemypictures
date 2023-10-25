import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  getMessage,
  getSelectedPoolPhoto,
  rateImage,
  selectImage,
} from "./photoPoolSlice";
import styles from "./PhotoPool.module.css";
import { useEffect, useRef } from "react";

export function SelectedPhoto() {
  const dispatch = useAppDispatch();
  const selectedPhoto = useAppSelector(getSelectedPoolPhoto);
  const message = useAppSelector(getMessage);

  const containerElem = useRef<HTMLDivElement>(null);

  function onClick() {
    dispatch(selectImage(null));
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
  });

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
    
    child = <img src={selectedPhoto.srcUrl} className={imgClass} alt="" onClick={onClick} title={"Click To Unselect\nPress Number Key To Rate Image"}></img>;
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
