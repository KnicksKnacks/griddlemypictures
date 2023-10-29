import "./App.css";
import { PhotoPool } from "./features/photoPool/PhotoPool";
import { MainPage } from "./features/pages/Page";
import { GridSelection } from "./features/pages/GridSelection";
import { PageSelection } from "./features/pages/PageSelection";
import { AppButtons } from "./features/render/RenderButton";
import { SelectedPhoto } from "./features/photoPool/SelectedPhoto";

function ShowPhotoCell() {
  return (
    <div id="TheApp">
      <PhotoPool></PhotoPool>
      <AppButtons />
      <PageSelection />
      <div className="main_row">
        <GridSelection />
        <MainPage />
        <SelectedPhoto />        
      </div>      
    </div>
  );
}

function App() {
  return <ShowPhotoCell />;
}

export default App;
