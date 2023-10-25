import { EntityId } from "@reduxjs/toolkit";
import { AppThunk } from "../../app/store";
import { selectAllCellsOnPage } from "../pages/photoCellSlice";
import { getSettings } from "../settings/settingsSlice";
import { selectPoolPhotoEntities } from "../photoPool/photoPoolSlice";

export const render =
  (pageId: EntityId): AppThunk<Promise<string | undefined>> =>
  async (dispatch, getState) => {
    const cells = selectAllCellsOnPage(getState(), pageId);
    const poolPhotos = selectPoolPhotoEntities(getState());
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const settings = getSettings(getState());
    const pageFactor = settings.ppi/100;
    if (!ctx) return;

    canvas.width = settings.widthInches * settings.ppi;
    canvas.height = settings.heightInches * settings.ppi;

    ctx.fillStyle = settings.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const cell of cells) {
      if (!cell || !cell.name) continue;      

      let scaleFac = cell.srcH / cell.h;
      // let scaleFac = img.naturalHeight / img.height;

      let sx = cell.x * scaleFac * -1;
      let sy = cell.y * scaleFac * -1;
      let sW = cell.dstW * scaleFac;
      let sH = cell.dstH * scaleFac;
      
      let dx = cell.dstX * pageFactor;
      let dy = cell.dstY * pageFactor;
      let dW = cell.dstW * pageFactor;
      let dH = cell.dstH * pageFactor;

      let img = new Image();
      img.src = poolPhotos[cell.name]?.srcUrl || "";
      try {
        await img.decode();
      } catch (e) {
        console.log(cell.name);
        console.log(e);
      }

      ctx.drawImage(img, sx, sy, sW, sH, dx, dy, dW, dH);
    }
    const src = canvas.toDataURL("image/jpeg", 0.9);
    //canvas.toBlob(blob=> { if (blob) saveAs(blob,`${pageNum}.jpg`)})
    canvas.remove();
    return src;
  };
