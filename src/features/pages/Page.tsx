import classNames from "classnames";
import { useAppSelector } from "../../app/hooks";
import { Grid } from "./Grid";
import styles from "./pages.module.css";
import { getAllPages, getCurrentPage } from "./pagesSlice";
import { GridDef } from "./photoCellSlice";
import { getSettings } from "../settings/settingsSlice";
import { useCallback, useEffect } from "react";
export function Page({
  grid,
  click = undefined,
  main = false,
  thePage = false,
}: {
  grid: GridDef;
  click?: React.MouseEventHandler | undefined;
  main?: boolean;
  thePage?: boolean;
}) {
  const settings = useAppSelector(getSettings);
  const style = main
    ? {
        height: `${settings.heightInches * 100}px`,
        width: `${settings.widthInches * 100}px`,
      }
    : {};
  const classes = classNames({
    [styles.page]: true,
    [styles.main_page]: main,
    [styles.the_page]: thePage,
    thepage: thePage
  });  
  return (
    <div className={classes} onClick={click} style={style} >
      <Grid def={grid} dir="col" noHandlers={click ? true : false} />
    </div>
  );
}

function scaleFunc() {
  const thePage = document.querySelector(`.${styles.the_page}`) as HTMLDivElement;    
  const wrapper = document.querySelector("#wrapper")as HTMLDivElement;
  let scale = 1;
  if (thePage && wrapper) {
    scale = Math.min(
      scale,
      wrapper.clientHeight / thePage.clientHeight
    );
    scale = Math.min(
      scale,
      wrapper.clientWidth / thePage.clientWidth
    );
   }
  if (thePage){
     thePage.style.scale = `${scale}`;
  }
}

export function MainPage() {
  const pageState = useAppSelector(getCurrentPage);
  const settings = useAppSelector(getSettings);

    
  useEffect(() => {
    window.addEventListener("resize", scaleFunc);
    return () => {
      window.removeEventListener("resize", scaleFunc);
    };
  },[]);
  useEffect(() => {
    scaleFunc();
  }, [pageState, settings.heightInches, settings.widthInches]);


  const pages = useAppSelector(getAllPages).map(page=>(
    <Page grid={page.grid} main={true} thePage={page.id===pageState?.id} key={page.id}/>
  ));

  const rendered = pageState ? (
    <div id="wrapper" className={styles.wrapper}>
      {pages}
    </div>
  ) : (
    <></>
  );
  return rendered;
}
