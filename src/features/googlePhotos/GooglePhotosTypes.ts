// MediaItem.ts
export interface MediaItem {
  id: string;
  description: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: MediaMetadata;
  contributorInfo: ContributorInfo;
  filename: string;
}

// MediaMetadata.ts
export interface MediaMetadata {
  creationTime: string; // Timestamp format
  width: string; // int64 format
  height: string; // int64 format
  metadata: Photo | Video; // Union field metadata
}

// Photo.ts
export interface Photo {
  cameraMake: string;
  cameraModel: string;
  focalLength: number;
  apertureFNumber: number;
  isoEquivalent: number;
  exposureTime: string; // Duration format
}

// Video.ts
export interface Video {
  cameraMake: string;
  cameraModel: string;
  fps: number;
  status: VideoProcessingStatus;
}

export enum VideoProcessingStatus {
  UNSPECIFIED = "UNSPECIFIED",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
}

// ContributorInfo.ts
export interface ContributorInfo {
  profilePictureBaseUrl: string;
  displayName: string;
}
