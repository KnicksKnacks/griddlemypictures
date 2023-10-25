import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  placeImage,
  centerImage,
  getPhotoCellById,
  moveImage,
  zoomImage,
  removeImage,
  setDstRect,
} from "./photoCellSlice";
import styles from "./pages.module.css";
import React, { useEffect, useRef, useState } from "react";
import { getPoolPhotoById, getSelectedPoolPhoto } from "../photoPool/photoPoolSlice";


// Used to use getBoundingClientRectangle here, but that yields the scaled dimensions.
// Using the offset... variety yields the unscaled info.  The left and top values
// work becasue the page element is selected as the offsetParent. I'm currently
// unclear as to why this is selected as such, and I think I need to set thepage's
// position to relative to ensure that this selection happens.
function getDims(elem: HTMLElement): Required<DOMRectInit> {  
  return {
    width: elem.offsetWidth,
    height: elem.offsetHeight,
    x: elem.offsetLeft,
    y: elem.offsetTop,
  };
}

function getScale(){
  let scale = parseFloat((document.querySelector('.thepage') as HTMLDivElement).style.scale);
  if (!scale) scale = 1;
  return scale;
}
export function PhotoCell({
  cellId,
  noHandlers,
}: {
  cellId: string;
  noHandlers: boolean;
}) {
  const cell = useAppSelector((state) => getPhotoCellById(state, cellId));
  const cellPoolPhoto = useAppSelector((state) =>
    getPoolPhotoById(state, cell?.name || "")
  );
  const selectedPoolPhoto = useAppSelector(getSelectedPoolPhoto);
  const dispatch = useAppDispatch();
  const cellElem = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    const elem = cellElem.current;
    function cellWheel(e: WheelEvent) {
      if (!elem || !e.shiftKey) return;
      e.preventDefault();
      let delta = e.ctrlKey ? 1 : 5;
      delta = e.deltaY < 0 ? delta : -delta;
      // Needs the scale here to correct the mouse click position back into the unscaled photocell element
      const scale=getScale();
      dispatch(      
        zoomImage({
          cellId: cellId,
          deltaY: delta,
          divx: (e.clientX - elem.getBoundingClientRect().x)/scale,
          divy: (e.clientY - elem.getBoundingClientRect().y)/scale,
        })
      );
    }
    if (elem) {
      elem.addEventListener("wheel", cellWheel, {
        passive: false,
      });
      
      // This should probably be in a useLayoutEffect...      
      if (!cell?.dstRatio)
      dispatch(
        setDstRect({
          cellId: cellId,
          dstRect: getDims(cellElem.current),
        })
      );
    }
    return () => {
      if (elem) {
        elem.removeEventListener("wheel", cellWheel);
      }
    };
  }, [cellElem, cellId, dispatch, cell]);

  interface point {
    x: number;
    y: number;
  }

  const [position, setPosition] = useState<point | null>(null);

  function cellClick() {
    if (cellElem.current) {
      dispatch(
        placeImage({
          cellId: cellId,
        })
      );
    }
  }

  function imgDblClick() {
    dispatch(
      removeImage({
        cellId: cellId,
      })
    );
  }

  function imgMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    if (e.shiftKey) {
      if (!cellPoolPhoto) return;
      dispatch(
        centerImage({
          cellId: cellId,
          poolPhoto: cellPoolPhoto,
        })
      );
    } else {
      setPosition({
        x: e.pageX,
        y: e.pageY,
      });
    }
  }
  function imgMouseMove(e: React.MouseEvent) {
    if (!position) return;
    if (!cell) return;

    const scale=getScale();
    let x = cell.x + (e.pageX - position.x)/scale;
    let y = cell.y + (e.pageY - position.y)/scale;
    setPosition({
      x: e.pageX,
      y: e.pageY,
    });
    dispatch(
      moveImage({
        cellId: cellId,
        x: x,
        y: y,
      })
    );
  }
  function imgMouseUp() {
    setPosition(null);
  }

  const photoTitle = selectedPoolPhoto ? "Click to Replace Image" : 
  "Click and drag to Move\nShift+wheel To Zoom\nShit+click to center faces\ndblClick to remove Image";
  const imageRender = cellPoolPhoto ? (
    <img
      src={cellPoolPhoto.srcUrl}
      alt=""
      height={cell?.h || "100%"}
      width={cell?.w || "100%"}
      style={{
        top: cell?.y,
        left: cell?.x,
      }}
      onMouseDown={imgMouseDown}
      onMouseMove={imgMouseMove}
      onMouseUp={imgMouseUp}
      onMouseLeave={imgMouseUp}
      onDoubleClick={imgDblClick}
      title={photoTitle}
    ></img>
  ) : (
    <></>
  );

  // Nohandlers indicates this cell is in the GridSelection, so set the title to undefined to defer to the gridSelection Title
  const cellTitle = noHandlers? undefined : cellPoolPhoto ? "": selectedPoolPhoto ?  "Click to Place Image" : "Select An Image First";
  return (
    <>
      <div
        className={`${styles.stretchy} ${styles.stretchy_leaf}`}
        ref={cellElem}
        onClick={noHandlers ? undefined : cellClick}
        title={cellTitle}
      >
        {imageRender}
      </div>
    </>
  );
}
