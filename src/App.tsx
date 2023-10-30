import "./App.css";
import { PhotoPool } from "./features/photoPool/PhotoPool";
import { MainPage } from "./features/pages/Page";
import { GridSelection } from "./features/pages/GridSelection";
import { PageSelection } from "./features/pages/PageSelection";
import { AppButtons } from "./features/render/RenderButton";
import { SelectedPhoto } from "./features/photoPool/SelectedPhoto";
import { PhotoPicker } from "./features/photoPool/PhotoPicker";

function ShowPhotoCell() {
  return (
    <div id="TheApp">      
      <AppButtons />
      <PageSelection />
      <div className="main_row">
        <GridSelection />
        <MainPage />
        <PhotoPool/>
      </div>      
    </div>
  );
}

function App() {
  if (window.location.pathname === "/photopool"){
    return <PhotoPicker/>
  }
  return <ShowPhotoCell />;
}

export default App;
