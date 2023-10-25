import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "../../app/hooks";
import { render } from "./render";

export function Preview() {
  const params = useParams();
  const dispatch = useAppDispatch();
  const pageNumStr = params.pageNum;

  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    const getrender = async () => {
      if (pageNumStr) {
        const pageNum = parseInt(pageNumStr);
        const dataurl = await dispatch(render(pageNum));
        if (dataurl) setSrc(dataurl);
      }
    };
    getrender();
  },[pageNumStr,dispatch]);

  if (src) {
    return <img src={src} alt="" style={{ height: "100vh" }}></img>;
  }
  return <></>;
}
