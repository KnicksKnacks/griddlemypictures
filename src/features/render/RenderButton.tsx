import JSZip from "jszip";
import React, { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearPage,
  deletePage,
  getCurrentPage,
  getCurrentPageNumber,
  getPageCount,
  getPageList,
  getPhotoNamesOnPage,
} from "../pages/pagesSlice";
import { render } from "./render";
import { saveAs } from "file-saver";
import {
  ClearAllAction,
  ImportAction,
  RedoAction,
  UndoAction,
  getExportState,
  redoAactive,
  undoAactive,
} from "../undo";
import { fillAll, fillPage, getAllPhotoCells } from "../pages/photoCellSlice";
import { RootState } from "../../app/store";
import { loadFiles } from "../photoPool/photoPoolFuncs";
import {
  getSettings,
  setFillRange,
  setHeightInches,
  setResolution,
  setWidthInches,
} from "../settings/settingsSlice";
import {
  AllRatings,
  filterByObject,
  filterByRating,
  getAllWebAiClasses,
  getObjectFilter,
  getPhotoRatingsSet,
  getRatingFilter,
  selectAllPoolPhotos,
  selectImage,
} from "../photoPool/photoPoolSlice";
import { LinkGooglePhotos } from "../googlePhotos/GooglePhotos";

function DownloadOneButton() {
  const dispatch = useAppDispatch();
  const currentpage = useAppSelector(getCurrentPage);
  const pageNum = useAppSelector(getCurrentPageNumber);
  async function click() {
    if (!currentpage) return;
    const anchor = document.createElement("a");
    anchor.download = `page${pageNum}`;
    const src = await dispatch(render(currentpage.id));
    if (!src) return;
    anchor.href = src;
    anchor.click();
    anchor.remove();
  }

  return <button onClick={click}>Page</button>;
}

function DownloadAllButton() {
  const dispatch = useAppDispatch();
  const pagesList = useAppSelector(getPageList);

  async function click() {
    const zip = new JSZip();
    for (let p = 0; p < pagesList.length; p++) {
      const src = await dispatch(render(pagesList[p].valueOf()));
      if (src) {
        const after = src.split(",")[1];
        zip.file(`page${p + 1}.jpeg`, after, { base64: true });
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "phook.zip");
  }

  return <button onClick={click}>All</button>;
}

function UndoButton() {
  const dispatch = useAppDispatch();
  const active = useAppSelector(undoAactive);

  const click = useCallback(() => {
    dispatch(UndoAction());
  }, [dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "z" && e.ctrlKey && !e.repeat) click();
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [click]);

  return (
    <button onClick={click} disabled={!active}>
      Undo
    </button>
  );
}

function RedoButton() {
  const dispatch = useAppDispatch();
  const active = useAppSelector(redoAactive);

  const click = useCallback(() => {
    dispatch(RedoAction());
  }, [dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "y" && e.ctrlKey && !e.repeat) click();
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [click]);

  return (
    <button onClick={click} disabled={!active}>
      Redo
    </button>
  );
}

function ClearAllButton() {
  const dispatch = useAppDispatch();
  function click() {
    dispatch(ClearAllAction());
  }
  return <button onClick={click}>Clear All Data</button>;
}

function FillAllButton() {
  const dispatch = useAppDispatch();

  function click() {
    dispatch(fillAll());
  }
  return <button onClick={click}>Fill All</button>;
}

function FillRange() {
  const dispatch = useAppDispatch();
  const value = useAppSelector(getSettings).fillRange;

  const handleFillRangeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = parseFloat(event.target.value);
    if (!isNaN(value)) dispatch(setFillRange(value));
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexFlow: "column",
        alignItems: "center",
      }}
    >
      <input
        type="range"
        value={value}
        min={0.05}
        max={0.5}
        step={0.05}
        onChange={handleFillRangeChange}
        style={{ width: "4vw" }}
      ></input>
      <label>Aspect Tol {`${value.toFixed(2)}`}</label>
    </div>
  );
}

function ObjectFilter() {
  const dispatch = useAppDispatch();
  const ratingFilterValue = useAppSelector(getObjectFilter);

  const handler: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    let value = e.target.value;
    //if (isNaN(value)) value = AllRatings;
    dispatch(filterByObject(value));
  };

  let values = useAppSelector(getAllWebAiClasses);
  let options = values.map((v) => (
    <option key={v} value={v}>
      {v}
    </option>
  ));
  options = [
    <option key={""} value={""}>
      All
    </option>,
    <option key={"none"} value={"none"}>
      none
    </option>,
    ...options,
  ];
  return (
    <label>
      ByObject:
      <select onChange={handler} value={ratingFilterValue}>
        {options}
      </select>
    </label>
  );
}

function FillPageButton() {
  const dispatch = useAppDispatch();

  function click() {
    dispatch(fillPage());
  }

  const noPages = useAppSelector(getPageCount) === 0;

  return (
    <button onClick={click} disabled={noPages}>
      Fill
    </button>
  );
}

function ClearPageButton() {
  const dispatch = useAppDispatch();
  const page = useAppSelector(getCurrentPage);
  const photosOnPage = useAppSelector((state) =>
    getPhotoNamesOnPage(state, page?.id)
  );
  const hasPics = photosOnPage.length > 0;

  function click() {
    dispatch(clearPage());
  }

  return (
    <button onClick={click} disabled={!hasPics}>
      Clear
    </button>
  );
}

function DeletePageButton() {
  const dispatch = useAppDispatch();
  const noPages = useAppSelector(getPageCount) === 0;

  function click() {
    dispatch(deletePage());
  }

  return (
    <button onClick={click} disabled={noPages}>
      Delete
    </button>
  );
}

function ExportButton() {
  const exportState = useAppSelector(getExportState);

  async function click() {
    const blob = new Blob([JSON.stringify(exportState)], {
      type: "application/json",
    });
    saveAs(blob, "export.json");
  }
  return <button onClick={click}>Export</button>;
}

function ImportButton() {
  const input = useRef<HTMLInputElement>(null);
  const dispatch = useAppDispatch();

  async function click() {
    if (input.current) input.current.click();
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target || !event.target.files) return;
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (
        !e ||
        !e.target ||
        !e.target.result ||
        e.target.result instanceof ArrayBuffer
      )
        return;
      const data = JSON.parse(e.target.result) as Partial<RootState>;
      if (data.pages && data.photocells && data.photopool && data.settings) {
        dispatch(ImportAction(data));
      }
    };
    reader.readAsText(file);
    // dispatch(loadFiles(event.target.files));
  }
  return (
    <>
      <input
        type="file"
        accept="application/json"
        multiple={false}
        onChange={onChange}
        style={{ display: "none" }}
        ref={input}
      />
      <button onClick={click}>Import</button>
    </>
  );
}

function AddPhotosButtononClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = true;
  input.onchange = (e) => {
    const event = e as any as React.ChangeEvent<HTMLInputElement>;
    if (!event.target || !event.target.files) return;
    loadFiles(event.target.files);
    input.remove();
  };
  input.click();
}

function AddPhotosButton() {
  return <button onClick={AddPhotosButtononClick}>Load Images</button>;
}

function RatingsFilter() {
  const dispatch = useAppDispatch();
  const ratingFilterValue = useAppSelector(getRatingFilter);

  const handler: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    let value = parseInt(e.target.value);
    if (isNaN(value)) value = AllRatings;
    dispatch(filterByRating(value));
  };

  let values = useAppSelector(getPhotoRatingsSet);
  let options = values.map((v) => (
    <option key={v} value={v}>
      {v}
    </option>
  ));
  options = [
    <option key={AllRatings} value={AllRatings}>
      All
    </option>,
    ...options,
  ];
  return (
    <label>
      ByRating:
      <select onChange={handler} value={ratingFilterValue}>
        {options}
      </select>
    </label>
  );
}

function ResolutionSettings() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(getSettings);

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(event.target.value);
    if (!isNaN(value)) dispatch(setWidthInches(value));
  };

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(event.target.value);
    if (!isNaN(value)) dispatch(setHeightInches(value));
  };

  const handlePPIChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(event.target.value);
    if (!isNaN(value)) dispatch(setResolution(value));
  };

  // Ensure no image is selected when modifying the page sizes, so that the
  // number presses aren't used to rate the selected image.
  // This is a bit of a hack, but should work well enough.
  const onFocus = () => {
    dispatch(selectImage(null));
  };

  return (
    <span>
      <fieldset id="page-layout">
        <legend>Page Layout</legend>
        <label>
          Width (inches):
          <input
            type="text"
            value={settings.widthInches}
            onChange={handleWidthChange}
            onFocus={onFocus}
          />
        </label>
        <label>
          Height (inches):
          <input
            type="text"
            value={settings.heightInches}
            onChange={handleHeightChange}
            onFocus={onFocus}
          />
        </label>
        <label>
          PPI (pixels per inch):
          <input
            type="text"
            value={settings.ppi}
            onChange={handlePPIChange}
            onFocus={onFocus}
          />
        </label>
      </fieldset>
    </span>
  );
}

function GithubButton() {
  return (
    <>
      <a href="https://github.com/KnicksKnacks/griddlemypictures" style={{margin: '0 10px'}}>
        <svg viewBox="0 0 98 96" width="20px" height="20px" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
            fill="#24292f"
          />
        </svg>
      </a>
    </>
  );
}

function LoadingBar() {  
  const progress = useAppSelector(getSettings).loadingProgress;
  const percent = 100 * progress || 100;

  return percent === 100 ? (
    <></>
  ) : (
    <div className="loading_bar">
      <div
        className="loading_bar_loaded"
        style={{ width: `${percent}%` }}
      >{percent.toFixed(3)}%</div>
    </div>
  );
}

function Stats(){
  const photosLoaded = useAppSelector(selectAllPoolPhotos).length;
  const cells = useAppSelector(getAllPhotoCells);
  const cellCnt = cells.length;
  const cellFilled = cells.filter(c=>c.name!=='').length;

  const title=`${photosLoaded} Photos\n${cellFilled}/${cellCnt} Cells Filled`;
  return <div title={title} style={{margin:'0 5px'}}>Stats</div>;
}

export function AppButtons() {
  return (
    <div className="control_buttons">
      <AddPhotosButton />
      <fieldset>
        <legend>Download</legend>
        <DownloadOneButton />
        <DownloadAllButton />
      </fieldset>
      <fieldset>
        <legend>&nbsp;</legend>
        <UndoButton />
        <RedoButton />
      </fieldset>
      <fieldset>
        <legend>Page</legend>
        {/* <FillPageButton /> */}
        <ClearPageButton />
        <DeletePageButton />
      </fieldset>
      <fieldset>
        <legend>Book</legend>
        <FillAllButton />
        <FillRange />
      </fieldset>
      <fieldset>
        <legend>JSON</legend>
        <ExportButton />
        <ImportButton />
      </fieldset>
      <fieldset>
        <legend>Photo Filter</legend>
        <RatingsFilter />
        <ObjectFilter />
      </fieldset>
      <ResolutionSettings />
      <Stats/>
      <ClearAllButton />
      <GithubButton/>      
      {/* <LinkGooglePhotos /> */}
      <LoadingBar />
    </div>
  );
}
