// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Quaternion, Vector3 } from "three";
import type { CameraState } from "./app";

type SerializableCameraState = {
  position: number[];
  quaternion: number[];
  target: number[];
  zoom: number;
};

const serializeCameraStates = (
  states: CameraState[]
): SerializableCameraState[] =>
  states.map((s) => ({
    position: s.position.toArray(),
    quaternion: s.quaternion.toArray(),
    target: s.target.toArray(),
    zoom: s.zoom,
  }));

const deserializeCameraStates = (
  states: SerializableCameraState[]
): CameraState[] =>
  states.map(
    (s) =>
      ({
        position: new Vector3().fromArray(s.position),
        quaternion: new Quaternion().fromArray(s.quaternion),
        target: new Vector3().fromArray(s.target),
        zoom: s.zoom,
      } as CameraState)
  );

const cameraStatesStorage = createJSONStorage<CameraState[]>(
  () => localStorage,
  {
    replacer: (key, value) => {
      if (key === "cameraStates") {
        return serializeCameraStates(value as CameraState[]);
      }
      return value;
    },
    reviver: (key, value) => {
      if (key === "cameraStates") {
        return deserializeCameraStates(value as SerializableCameraState[]);
      }
      return value;
    },
  }
);

export const cameraStatesAtom = atomWithStorage<CameraState[]>(
  "cameraStates",
  [],
  cameraStatesStorage,
  { getOnInit: true }
);

export const isRecordingAtom = atom(false);

export const splatSourceAtom = atom<{
  url: string;
  format: GaussianSplats3D.SceneFormat;
} | null>(null);

// Leva controls state as atoms
export const splatAlphaRemovalThresholdAtom = atomWithStorage(
  "splatAlphaRemovalThreshold",
  1 / 255,
  undefined,
  { getOnInit: true }
);
export const splatSizeThresholdAtom = atomWithStorage(
  "splatSizeThreshold",
  1000,
  undefined,
  { getOnInit: true }
);
export const splatScaleAtom = atomWithStorage("splatScale", 1, undefined, {
  getOnInit: true,
});
export const backgroundAtom = atomWithStorage(
  "background",
  {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  },
  undefined,
  { getOnInit: true }
);
export const aspectRatioAtom = atomWithStorage(
  "aspectRatio",
  "16:9",
  undefined,
  { getOnInit: true }
);
export const noisinessAtom = atomWithStorage("noisiness", 0.1, undefined, {
  getOnInit: true,
});
export const ditherGranularityAtom = atomWithStorage(
  "ditherGranularity",
  1,
  undefined,
  { getOnInit: true }
);
export const noiseScaleXAtom = atomWithStorage("noiseScaleX", 0, undefined, {
  getOnInit: true,
});
export const noiseScaleYAtom = atomWithStorage("noiseScaleY", 0, undefined, {
  getOnInit: true,
});
export const noiseScaleZAtom = atomWithStorage("noiseScaleZ", 0, undefined, {
  getOnInit: true,
});
export const noiseSpeedAtom = atomWithStorage("noiseSpeed", 0.1, undefined, {
  getOnInit: true,
});
export const noiseRateXAtom = atomWithStorage("noiseRateX", 1, undefined, {
  getOnInit: true,
});
export const noiseRateYAtom = atomWithStorage("noiseRateY", 1, undefined, {
  getOnInit: true,
});
export const noiseRateZAtom = atomWithStorage("noiseRateZ", 1, undefined, {
  getOnInit: true,
});
export const noiseSharpnessAtom = atomWithStorage(
  "noiseSharpness",
  1,
  undefined,
  { getOnInit: true }
);
export const gridScaleAtom = atomWithStorage("gridScale", 0.1, undefined, {
  getOnInit: true,
});
export const gridAmountAtom = atomWithStorage("gridAmount", 0, undefined, {
  getOnInit: true,
});
export const fogStartAtom = atomWithStorage("fogStart", 0, undefined, {
  getOnInit: true,
});
export const fogEndAtom = atomWithStorage("fogEnd", 20, undefined, {
  getOnInit: true,
});
export const fogAmountAtom = atomWithStorage("fogAmount", 0, undefined, {
  getOnInit: true,
});
export const wrapCubeSizeXAtom = atomWithStorage(
  "wrapCubeSizeX",
  0,
  undefined,
  {
    getOnInit: true,
  }
);
export const wrapCubeSizeYAtom = atomWithStorage(
  "wrapCubeSizeY",
  0,
  undefined,
  {
    getOnInit: true,
  }
);
export const wrapCubeSizeZAtom = atomWithStorage(
  "wrapCubeSizeZ",
  0,
  undefined,
  {
    getOnInit: true,
  }
);
export const playAnimationAtom = atom(false);
export const animationSpeedAtom = atomWithStorage(
  "animationSpeed",
  1,
  undefined,
  { getOnInit: true }
);
export const perfectLoopAtom = atomWithStorage(
  "perfectLoop",
  false,
  undefined,
  {
    getOnInit: true,
  }
);
export const videoResolutionAtom = atomWithStorage(
  "videoResolution",
  1920,
  undefined,
  { getOnInit: true }
);
export const videoFramerateAtom = atomWithStorage(
  "videoFramerate",
  60,
  undefined,
  { getOnInit: true }
);
export const videoBitrateAtom = atomWithStorage(
  "videoBitrate",
  100,
  undefined,
  { getOnInit: true }
);
export const autoStopModeAtom = atomWithStorage(
  "autoStopMode",
  "Manual",
  undefined,
  { getOnInit: true }
);
export const videoDurationAtom = atomWithStorage(
  "videoDuration",
  10,
  undefined,
  { getOnInit: true }
);
export const imageNameAtom = atomWithStorage("imageName", "export", undefined, {
  getOnInit: true,
});
export const exportSizeAtom = atomWithStorage("exportSize", 4000, undefined, {
  getOnInit: true,
});
