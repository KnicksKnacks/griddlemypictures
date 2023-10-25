import { GridDef } from "./photoCellSlice";
import styles from "./pages.module.css";
import classNames from "classnames";
import { PhotoCell } from "./PhotoCell";

type direction = "row" | "col";

export function Grid({ def, dir = "row", noHandlers }: { def: GridDef; dir: direction; noHandlers: boolean }) {

  const nextDir = dir === "row" ? "col" : "row"  
  let renderedChildren;
  if (def.children){
    renderedChildren = def.children.map((g,i) => (<Grid def={g} dir={nextDir} key={g.id} noHandlers={noHandlers}></Grid>))
  }else{
    renderedChildren = (<PhotoCell cellId={def.cellId} noHandlers={noHandlers}></PhotoCell>)
  }  
    
  const classes = classNames({
    [styles.stretchy]:true,
    [styles.stretchy_row]: dir==="row",
    [styles.stretchy_col]:dir==="col",
     })

  return (
    <div className={classes} style={{flex:def.flex}} >{renderedChildren}</div>
  )
  
}
