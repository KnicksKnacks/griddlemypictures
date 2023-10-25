import localforage from "localforage";
import * as faceapi from "face-api.js";
import {
  Box,
  Point,
  addImage,
  getEmptyPoolPhoto,
  getPoolPhotoById,
  updatePhoto,
} from "./photoPoolSlice";
import { store } from "../../app/store";
import {
  ImageModel,
  ObjectDetectionModel,
  ObjectDetectionPrediction,
  SessionParams
} from "@visheratin/web-ai";
import { MediaItem } from "../googlePhotos/GooglePhotosTypes";
import { googlePhotosConfig } from "../googlePhotos/GooglePhotos";

const imgBlob = localforage.createInstance({ name: "imgBlob" });
export const blobUrlMap = new Map<string, string>();

let model: ObjectDetectionModel | null = null;
function calcAiStuff(webai: ObjectDetectionPrediction[] | undefined) {
  let SubjectCount = 0;
  const centerFinder = new CenterOfBoxes();
  webai?.forEach((obj) => {
    if (["cat", "person","dog"].includes(obj.class)) {
      SubjectCount++;
      centerFinder.add({
        left: obj.x,
        right: obj.x + obj.width,
        top: obj.y,
        bottom: obj.y + obj.height,
      });
    }
  });

  if (!centerFinder.isEmpty()) {
    let aiCenter = centerFinder.getcenter();
    let aiRating = SubjectCount * 15 + centerFinder.getCoveragePercent() * 100;
    return {
      aiCenter: aiCenter,
      aiRating: aiRating,
      rating: Math.min(9, Math.round(aiRating / 20)),
    };
  }
  return {};
}

async function webAiProcess(data: { name: string; dataUrl: string }) {
  if (model) {
    console.log(`Inference of ${data.name} starting`);
    const output = await model.process(data.dataUrl);
    console.log(
      `Inference of ${data.name} finished in ${output.elapsed} seconds.`
    );
    store.dispatch(
      updatePhoto({
        id: data.name,
        webai: output.objects,
        ...calcAiStuff(output.objects),
      })
    );
  }
}

async function loadImage(name: string) {
  const retreive = (await imgBlob.getItem(name)) as Blob;
  const u = URL.createObjectURL(retreive);
  blobUrlMap.set(name, u);
  store.dispatch(
    updatePhoto({
      id: name,
      srcUrl: u,
    })
  );
  return u;
}

async function* loadNextImg() {
  const keys = await imgBlob.keys();
  for (const k of keys) {
    await loadImage(k);
    yield k;
  }
}

const loadNextGenerator = loadNextImg();

async function loadImages() {
  let next = await loadNextGenerator.next();
  const start = new Date();
  while (new Date().getTime() - start.getTime() < 50 && !next.done) {
    next = await loadNextGenerator.next();
  }
  if (!next.done) {
    setTimeout(loadImages, 0);
  }
}
loadImages();

async function setup() {
  const faceLoad = faceapi.nets.ssdMobilenetv1.loadFromUri("./weights/");
  SessionParams.numThreads=4;
  const webAiLoad = ImageModel.create("yolos-tiny-quant");
  await Promise.allSettled([faceLoad, webAiLoad]);
  const result = await webAiLoad;
  console.log(result.elapsed);
  model = result.model as ObjectDetectionModel;
}
setup();

function getSmallDataUrl(
  theImg: HTMLImageElement,
  height: number = 100
): string {
  // Create a canvas element
  var canvas = document.createElement("canvas");

  // Set the canvas dimensions to the desired output size
  var outputWidth = theImg.naturalWidth * (height / theImg.naturalHeight);
  canvas.width = outputWidth;
  canvas.height = height;
  // Draw the image onto the canvas
  var ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(theImg, 0, 0, outputWidth, height);

  return canvas.toDataURL();
}

export class CenterOfBoxes {
  left = 1e6;
  right = 0;
  top = 1e6;
  bottom = 0;
  empty = true;

  add(r: Box) {
    this.empty = false;
    this.left = Math.min(this.left, r.left);
    this.right = Math.max(this.right, r.right);
    this.top = Math.min(this.top, r.top);
    this.bottom = Math.max(this.bottom, r.bottom);
  }
  getcenter(): Point {
    return {
      x: (this.left + this.right) / 2,
      y: (this.top + this.bottom) / 2,
    };
  }
  isEmpty() {
    return this.empty;
  }
  getCoveragePercent(width: number = 1, height: number = 1) {
    if (this.empty) return 0;
    return (
      (Math.abs(this.top - this.bottom) * Math.abs(this.right - this.left)) /
      (width * height)
    );
  }
}

async function InitInPool(
  name: string,
  imgUrl: string
): Promise<HTMLImageElement> {
  return new Promise(async (resolve) => {
    const img = new Image();
    img.src = imgUrl;
    await img.decode();
    store.dispatch(
      updatePhoto({
        id: name,
        srcUrl: imgUrl,
        naturalSize: {
          x: img.naturalWidth,
          y: img.naturalHeight,
        },
      })
    );
    resolve(img);
  });
}

async function DetectFaces(name: string, img: HTMLImageElement) {
  const faces = await faceapi.detectAllFaces(img);
  if (faces.length > 0) {
    const faceBoxes: Box[] = [];
    let centerFace: Point | undefined = undefined;
    let centerFinder = new CenterOfBoxes();
    faces.forEach((face) => {
      faceBoxes.push({
        left: face.relativeBox.left,
        right: face.relativeBox.right,
        top: face.relativeBox.top,
        bottom: face.relativeBox.bottom,
      });
      centerFinder.add(face.relativeBox);
    });
    centerFace = centerFinder.getcenter();
    store.dispatch(
      updatePhoto({
        id: name,
        faces: faceBoxes,
        centerFace: centerFace,
      })
    );
  }
}

async function aiHelper(name: string, img: HTMLImageElement) {
  if (img) await DetectFaces(name, img);
  await webAiProcess({
    name: name,
    dataUrl: getSmallDataUrl(img, 300),
  });
}
const q = [] as (() => Promise<void>)[];

async function doQ() {
  const top = q.pop();
  if (top) {
    await top();
    setTimeout(doQ, 0);
  }
}

function loadFile(file: File) {
  const name = file.name;    
  q.push(async()=>{
    LoadIt(name,async()=>{
      const arrayBuf = await file.arrayBuffer();
      const blob = new Blob([arrayBuf], { type: file.type });
      return blob
    });
  })
}

export function loadFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith("image/")) loadFile(files[i]);
    }
    doQ();
};

export async function ClearAllPhotoData() {
  imgBlob.clear();
  blobUrlMap.clear();
}

function StashBlob(id: string, blob: Blob): string {
  const imgUrl = URL.createObjectURL(blob);
  blobUrlMap.set(id, imgUrl);
  // Store the Blob directly in localForage
  imgBlob
    .setItem(id, blob)
    .then(async function () {
      console.log("Blob stored in localForage.");
    })
    .catch(function (err) {
      console.error("Error storing Blob:", err);
    });
  return imgUrl;
}



async function UrlToBlob(url:string){
  url = url.replace('https://lh3.googleusercontent.com',googlePhotosConfig.proxy);
  const resp = await fetch(url);
  const blob = await resp.blob();
  return blob;
}


type MyMediaItem = MediaItem & { fullsize: string };

function loadUrl(photo: MyMediaItem) {
  const name = photo.id;  
  q.push(async()=>{
    LoadIt(name,()=>{return UrlToBlob(photo.fullsize)});
  })
}

export function  LoadUrls(photos: MyMediaItem[]){
  photos.forEach(p=>loadUrl(p));
  doQ();
}


type ReadsBlob = ()=>Promise<Blob>;

async function LoadIt(name:string, getBlob: ReadsBlob){
  const existing = getPoolPhotoById(store.getState(), name);
  if (!existing){
    const data = getEmptyPoolPhoto();
    data.id = name;
    store.dispatch(addImage({ photo: data }));
  }    
  //if (existing?.srcUrl) return;
  const blob = await getBlob();
  const imgUrl = StashBlob(name, blob);  
  if (imgUrl === "") return;
  if (existing) {
    store.dispatch(
      updatePhoto({
        id: name,
        srcUrl: imgUrl,
      })
    );
    return;
  }
  const img = await InitInPool(name, imgUrl);
  await aiHelper(name, img);
}