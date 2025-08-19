// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { Quaternion, Vector3 } from "three";
import type { State } from "./app";

type SerializableState = {
  position: number[];
  quaternion: number[];
  target: number[];
  zoom: number;
  params?: any;
};

const serializeAnimationStates = (states: State[]): SerializableState[] =>
  states.map((s) => ({
    position: s.position.toArray(),
    quaternion: s.quaternion.toArray(),
    target: s.target.toArray(),
    zoom: s.zoom,
    params: s.params,
  }));

const deserializeAnimationStates = (states: SerializableState[]): State[] =>
  states.map(
    (s) =>
      ({
        position: new Vector3().fromArray(s.position),
        quaternion: new Quaternion().fromArray(s.quaternion),
        target: new Vector3().fromArray(s.target),
        zoom: s.zoom,
        params: s.params,
      } as State)
  );

const animationStatesStorage = createJSONStorage<State[]>(() => localStorage, {
  replacer: (key, value) => {
    if (key === "animationStates") {
      return serializeAnimationStates(value as State[]);
    }
    return value;
  },
  reviver: (key, value) => {
    if (key === "animationStates") {
      return deserializeAnimationStates(value as SerializableState[]);
    }
    return value;
  },
});

export const animationStatesAtom = atomWithStorage<State[]>(
  "animationStates",
  [],
  animationStatesStorage,
  { getOnInit: true }
);

export const isRecordingAtom = atom(false);

export const splatSourceAtom = atom<{
  url: string;
  format: GaussianSplats3D.SceneFormat;
} | null>(null);

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
export const lightingEnabledAtom = atomWithStorage(
  "lightingEnabled",
  false,
  undefined,
  { getOnInit: true }
);
export const lightColorAtom = atomWithStorage(
  "lightColor",
  { r: 255, g: 255, b: 255 },
  undefined,
  { getOnInit: true }
);
export const lightIntensityAtom = atomWithStorage(
  "lightIntensity",
  1,
  undefined,
  { getOnInit: true }
);
export const lightXAtom = atomWithStorage("lightX", 0, undefined, {
  getOnInit: true,
});
export const lightYAtom = atomWithStorage("lightY", 0, undefined, {
  getOnInit: true,
});
export const lightRadiusAtom = atomWithStorage("lightRadius", 1, undefined, {
  getOnInit: true,
});
export const lightZAtom = atomWithStorage("lightZ", 0, undefined, {
  getOnInit: true,
});
export const ambientLightIntensityAtom = atomWithStorage(
  "ambientLightIntensity",
  1,
  undefined,
  { getOnInit: true }
);
export const focusFocalDistanceAtom = atomWithStorage(
  "focusFocalDistance",
  10,
  undefined,
  { getOnInit: true }
);
export const focusFocalDepthAtom = atomWithStorage(
  "focusFocalDepth",
  2,
  undefined,
  { getOnInit: true }
);
export const focusMaxSizeAtom = atomWithStorage("focusMaxSize", 2, undefined, {
  getOnInit: true,
});
// Add move speed atoms
export const moveSpeedXAtom = atomWithStorage("moveSpeedX", 0, undefined, {
  getOnInit: true,
});
export const moveSpeedYAtom = atomWithStorage("moveSpeedY", 0, undefined, {
  getOnInit: true,
});
export const moveSpeedZAtom = atomWithStorage("moveSpeedZ", 0, undefined, {
  getOnInit: true,
});
export const lockWrapCubeToCameraAtom = atomWithStorage(
  "lockWrapCubeToCamera",
  false,
  undefined,
  { getOnInit: true }
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
export const animateParamsAtom = atomWithStorage(
  "animateParams",
  true,
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
