import { useAppDispatch } from "../../app/hooks";
import { gridDefs } from "./gridFuncs";
import { Page } from "./Page";
import styles from "./pages.module.css";
import { gridSelectionClick } from "./pagesSlice";

export function GridSelection(){
  const dispatch = useAppDispatch()
  const renderedPages= gridDefs.map((grid,i)=>{
    function click(e: React.MouseEvent){
      dispatch(gridSelectionClick(grid,e))
    }
    return (
    <Page grid={grid} key={i} click={click}/>
  )})
  return (
    <div className={styles.grids} title={"Click To Switch Layout\nShift+Click to add New page"}>{renderedPages}</div>
  )
}