import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { changePage, getCurrentPage, getPageList, hasUnfilledPages, showUnfilledPage } from "./pagesSlice";

export function PageSelection() {
  const dispatch = useAppDispatch()
  const curPage = useAppSelector(getCurrentPage)?.id;
  const pageButtons = useAppSelector(getPageList).map((id, pgnum) => {
    const buttonText = `${pgnum + 1}`;
    const buttonFormat =
      curPage === id ? <b>{buttonText}</b> : <>{buttonText}</>;
    return (
      <button
        onClick={() => {
          dispatch(changePage(id));
        }}
        key={id}
      >
        {buttonFormat}
      </button>
    );
  });
  const unfilled = useAppSelector(hasUnfilledPages) ? (
  <button
    onClick={()=>{dispatch(showUnfilledPage())}}    
  >
    Unfilled
  </button>) : <></>



  return <div id="PageButtons" className="button_row">{pageButtons}{unfilled}</div>;
}
