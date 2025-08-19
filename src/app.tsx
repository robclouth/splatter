// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { Canvas } from "@react-three/fiber";
import { useAtom, useSetAtom } from "jotai";
import { Pane } from "tweakpane";
import { useEffect, useRef, useState, useCallback } from "react";
import { Quaternion, Vector3 } from "three";
import { Scene } from "./scene";
import {
  animationSpeedAtom,
  animateParamsAtom,
  aspectRatioAtom,
  autoStopModeAtom,
  backgroundAtom,
  animationStatesAtom,
  ditherGranularityAtom,
  exportSizeAtom,
  fogAmountAtom,
  fogEndAtom,
  fogStartAtom,
  gridAmountAtom,
  gridScaleAtom,
  imageNameAtom,
  isRecordingAtom,
  lightColorAtom,
  lightIntensityAtom,
  lightRadiusAtom,
  lightingEnabledAtom,
  lightXAtom,
  lightYAtom,
  lightZAtom,
  ambientLightIntensityAtom,
  focusFocalDistanceAtom,
  focusFocalDepthAtom,
  focusMaxSizeAtom,
  moveSpeedXAtom,
  moveSpeedYAtom,
  moveSpeedZAtom,
  noiseRateXAtom,
  noiseRateYAtom,
  noiseRateZAtom,
  noiseScaleXAtom,
  noiseScaleYAtom,
  noiseScaleZAtom,
  noiseSharpnessAtom,
  noiseSpeedAtom,
  noisinessAtom,
  perfectLoopAtom,
  playAnimationAtom,
  splatAlphaRemovalThresholdAtom,
  splatScaleAtom,
  splatSizeThresholdAtom,
  splatSourceAtom,
  videoBitrateAtom,
  videoDurationAtom,
  videoFramerateAtom,
  videoResolutionAtom,
  wrapCubeSizeXAtom,
  wrapCubeSizeYAtom,
  wrapCubeSizeZAtom,
} from "./store";
import { PerformanceMonitor } from "@react-three/drei";

export type SplatParams = {
  noisiness: number;
  ditherGranularity: number;
  noiseScaleX: number;
  noiseScaleY: number;
  noiseScaleZ: number;
  noiseSpeed: number;
  noiseRateX: number;
  noiseRateY: number;
  noiseRateZ: number;
  noiseSharpness: number;
  gridScale: number;
  gridAmount: number;
  fogStart: number;
  fogEnd: number;
  fogAmount: number;
  wrapCubeSizeX: number;
  wrapCubeSizeY: number;
  wrapCubeSizeZ: number;
  videoResolution: number;
  videoFramerate: number;
  videoBitrate: number;
};

export type AnimationParams = {
  splatScale: number;
  noisiness: number;
  ditherGranularity: number;
  noiseScaleX: number;
  noiseScaleY: number;
  noiseScaleZ: number;
  noiseSpeed: number;
  noiseRateX: number;
  noiseRateY: number;
  noiseRateZ: number;
  noiseSharpness: number;
  gridScale: number;
  gridAmount: number;
  fogStart: number;
  fogEnd: number;
  fogAmount: number;
  wrapCubeSizeX: number;
  wrapCubeSizeY: number;
  wrapCubeSizeZ: number;
  lightingEnabled: boolean;
  lightColor: { r: number; g: number; b: number };
  lightIntensity: number;
  lightX: number;
  lightY: number;
  lightZ: number;
  lightRadius: number;
  ambientLightIntensity: number;
  focusFocalDistance: number;
  focusFocalDepth: number;
  focusMaxSize: number;
  moveSpeedX: number;
  moveSpeedY: number;
  moveSpeedZ: number;
  background: { r: number; g: number; b: number; a: number };
};

export type State = {
  position: Vector3;
  quaternion: Quaternion;
  target: Vector3;
  zoom: number;
  params?: AnimationParams;
};

export type SceneRef = {
  exportImage: (filename: string) => void;
  getState: () => State | null;
  startRecording: (
    width: number,
    framerate: number,
    bitrate: number,
    autoStopMode: string,
    duration?: number
  ) => void;
  stopRecording: (filename: string) => Promise<void>;
};

export default function App() {
  const sceneRef = useRef<SceneRef>(null);
  const [dpr, setDpr] = useState(1);

  const setAnimationStates = useSetAtom(animationStatesAtom);

  const [isRecording, setIsRecording] = useAtom(isRecordingAtom);

  const setSplatSource = useSetAtom(splatSourceAtom);
  const [splatAlphaRemovalThreshold, setSplatAlphaRemovalThreshold] = useAtom(
    splatAlphaRemovalThresholdAtom
  );
  const [splatSizeThreshold, setSplatSizeThreshold] = useAtom(
    splatSizeThresholdAtom
  );
  const [splatScale, setSplatScale] = useAtom(splatScaleAtom);
  const [background, setBackground] = useAtom(backgroundAtom);
  const [aspectRatio, setAspectRatio] = useAtom(aspectRatioAtom);
  const [noisiness, setNoisiness] = useAtom(noisinessAtom);
  const [ditherGranularity, setDitherGranularity] = useAtom(
    ditherGranularityAtom
  );
  const [noiseScaleX, setNoiseScaleX] = useAtom(noiseScaleXAtom);
  const [noiseScaleY, setNoiseScaleY] = useAtom(noiseScaleYAtom);
  const [noiseScaleZ, setNoiseScaleZ] = useAtom(noiseScaleZAtom);
  const [noiseSpeed, setNoiseSpeed] = useAtom(noiseSpeedAtom);
  const [noiseRateX, setNoiseRateX] = useAtom(noiseRateXAtom);
  const [noiseRateY, setNoiseRateY] = useAtom(noiseRateYAtom);
  const [noiseRateZ, setNoiseRateZ] = useAtom(noiseRateZAtom);
  const [noiseSharpness, setNoiseSharpness] = useAtom(noiseSharpnessAtom);
  const [gridScale, setGridScale] = useAtom(gridScaleAtom);
  const [gridAmount, setGridAmount] = useAtom(gridAmountAtom);
  const [fogStart, setFogStart] = useAtom(fogStartAtom);
  const [fogEnd, setFogEnd] = useAtom(fogEndAtom);
  const [fogAmount, setFogAmount] = useAtom(fogAmountAtom);
  const [wrapCubeSizeX, setWrapCubeSizeX] = useAtom(wrapCubeSizeXAtom);
  const [wrapCubeSizeY, setWrapCubeSizeY] = useAtom(wrapCubeSizeYAtom);
  const [wrapCubeSizeZ, setWrapCubeSizeZ] = useAtom(wrapCubeSizeZAtom);
  const [lightingEnabled, setLightingEnabled] = useAtom(lightingEnabledAtom);
  const [lightColor, setLightColor] = useAtom(lightColorAtom);
  const [lightIntensity, setLightIntensity] = useAtom(lightIntensityAtom);
  const [lightX, setLightX] = useAtom(lightXAtom);
  const [lightY, setLightY] = useAtom(lightYAtom);
  const [lightZ, setLightZ] = useAtom(lightZAtom);
  const [lightRadius, setLightRadius] = useAtom(lightRadiusAtom);
  const [ambientLightIntensity, setAmbientLightIntensity] = useAtom(
    ambientLightIntensityAtom
  );
  const [focusFocalDistance, setFocusFocalDistance] = useAtom(
    focusFocalDistanceAtom
  );
  const [focusFocalDepth, setFocusFocalDepth] = useAtom(focusFocalDepthAtom);
  const [focusMaxSize, setFocusMaxSize] = useAtom(focusMaxSizeAtom);
  const [moveSpeedX, setMoveSpeedX] = useAtom(moveSpeedXAtom);
  const [moveSpeedY, setMoveSpeedY] = useAtom(moveSpeedYAtom);
  const [moveSpeedZ, setMoveSpeedZ] = useAtom(moveSpeedZAtom);
  const [playAnimation, setPlayAnimation] = useAtom(playAnimationAtom);
  const [animationSpeed, setAnimationSpeed] = useAtom(animationSpeedAtom);
  const [perfectLoop, setPerfectLoop] = useAtom(perfectLoopAtom);
  const [animateParams, setAnimateParams] = useAtom(animateParamsAtom);
  const [videoResolution, setVideoResolution] = useAtom(videoResolutionAtom);
  const [videoFramerate, setVideoFramerate] = useAtom(videoFramerateAtom);
  const [videoBitrate, setVideoBitrate] = useAtom(videoBitrateAtom);
  const [autoStopMode, setAutoStopMode] = useAtom(autoStopModeAtom);
  const [videoDuration, setVideoDuration] = useAtom(videoDurationAtom);
  const [imageName, setImageName] = useAtom(imageNameAtom);
  const [exportSize, setExportSize] = useAtom(exportSizeAtom);

  const resetControls = () => {
    setSplatAlphaRemovalThreshold(1 / 255);
    setSplatSizeThreshold(1000);
    setSplatScale(1);
    setBackground({ r: 255, g: 255, b: 255, a: 1 });
    setAspectRatio("16:9");
    setNoisiness(0.1);
    setDitherGranularity(1);
    setNoiseScaleX(0);
    setNoiseScaleY(0);
    setNoiseScaleZ(0);
    setNoiseSpeed(0.1);
    setNoiseRateX(1);
    setNoiseRateY(1);
    setNoiseRateZ(1);
    setNoiseSharpness(1);
    setGridScale(0.1);
    setGridAmount(0);
    setFogStart(0);
    setFogEnd(20);
    setFogAmount(0);
    setWrapCubeSizeX(0);
    setWrapCubeSizeY(0);
    setWrapCubeSizeZ(0);
    setLightingEnabled(false);
    setLightColor({ r: 255, g: 255, b: 255 });
    setLightIntensity(1);
    setLightX(0);
    setLightY(0);
    setLightZ(0);
    setLightRadius(1);
    setAmbientLightIntensity(1);
    setFocusFocalDistance(10);
    setFocusFocalDepth(2);
    setFocusMaxSize(2);
    setMoveSpeedX(0);
    setMoveSpeedY(0);
    setMoveSpeedZ(0);
    setPlayAnimation(false);
    setAnimationSpeed(1);
    setPerfectLoop(false);
    setAnimateParams(true);
    setVideoResolution(1920);
    setVideoFramerate(60);
    setVideoBitrate(100);
    setAutoStopMode("Manual");
    setVideoDuration(10);
    setImageName("export");
    setExportSize(4000);
    setAnimationStates([]);
  };

  const [recordingProgress, setRecordingProgress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const paneRef = useRef<Pane | null>(null);
  const params = useRef<any>({}).current;
  const controlRefs = useRef<{ [key: string]: any }>({}).current;

  Object.assign(params, {
    splatAlphaRemovalThreshold,
    splatSizeThreshold,
    splatScale,
    background,
    aspectRatio,
    noisiness,
    ditherGranularity,
    noiseScaleX,
    noiseScaleY,
    noiseScaleZ,
    noiseSpeed,
    noiseRateX,
    noiseRateY,
    noiseRateZ,
    noiseSharpness,
    gridScale,
    gridAmount,
    fogStart,
    fogEnd,
    fogAmount,
    wrapCubeSizeX,
    wrapCubeSizeY,
    wrapCubeSizeZ,
    lightingEnabled,
    lightColor,
    lightIntensity,
    lightX,
    lightY,
    lightZ,
    lightRadius,
    ambientLightIntensity,
    focusFocalDistance,
    focusFocalDepth,
    focusMaxSize,
    moveSpeedX,
    moveSpeedY,
    moveSpeedZ,
    playAnimation,
    animationSpeed,
    perfectLoop,
    animateParams,
    videoResolution,
    videoFramerate,
    videoBitrate,
    autoStopMode,
    videoDuration,
    imageName,
    exportSize,
    recordingProgress,
  });

  const handleStopRecording = useCallback(() => {
    if (!sceneRef.current) return;
    setIsRecording(false);
    sceneRef.current.stopRecording(imageName).then(() => {
      console.log("Recording finished");
    });
  }, [imageName, setIsRecording]);

  useEffect(() => {
    paneRef.current?.refresh();
  });

  useEffect(() => {
    const pane = new Pane({
      title: "Controls",
    });
    paneRef.current = pane;

    pane
      .addButton({ title: "Reset All Controls" })
      .on("click", () => resetControls());

    const importFolder = pane.addFolder({ title: "Import" });
    importFolder
      .addButton({ title: "Load Splat" })
      .on("click", () => fileInputRef.current?.click());

    const splatsFolder = pane.addFolder({ title: "Splats" });
    splatsFolder
      .addBinding(params, "splatAlphaRemovalThreshold", {
        min: 0,
        max: 255,
        step: 1,
        label: "Alpha Removal Threshold",
      })
      .on("change", (e) => setSplatAlphaRemovalThreshold(e.value));
    splatsFolder
      .addBinding(params, "splatSizeThreshold", {
        min: 0,
        max: 10000,
        step: 1,
        label: "Size Threshold",
      })
      .on("change", (e) => setSplatSizeThreshold(e.value));
    splatsFolder
      .addBinding(params, "splatScale", {
        min: 0.1,
        max: 5,
        step: 0.1,
        label: "Scale",
      })
      .on("change", (e) => setSplatScale(e.value));

    const canvasFolder = pane.addFolder({ title: "Canvas", expanded: false });
    canvasFolder
      .addBinding(params, "background", { label: "Background" })
      .on("change", (e) =>
        setBackground({
          r: e.value.r,
          g: e.value.g,
          b: e.value.b,
          a: e.value.a,
        })
      );
    canvasFolder
      .addBinding(params, "aspectRatio", {
        label: "Aspect Ratio",
        options: {
          "16:9": "16:9",
          "4:3": "4:3",
          "3:2": "3:2",
          "1:1": "1:1",
          "9:16": "9:16",
          "3:4": "3:4",
          "2:3": "2:3",
        },
      })
      .on("change", (e) => setAspectRatio(e.value));

    const grainFolder = pane.addFolder({ title: "Grain", expanded: false });
    grainFolder
      .addBinding(params, "noisiness", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Noisiness",
      })
      .on("change", (e) => setNoisiness(e.value));
    grainFolder
      .addBinding(params, "ditherGranularity", {
        min: 1,
        max: 1000000,
        step: 1,
        label: "Dither Granularity",
      })
      .on("change", (e) => setDitherGranularity(e.value));

    const noiseFolder = pane.addFolder({ title: "Noise", expanded: false });
    noiseFolder
      .addBinding(params, "noiseScaleX", {
        min: 0,
        max: 10,
        step: 0.01,
        label: "Scale X",
      })
      .on("change", (e) => setNoiseScaleX(e.value));
    noiseFolder
      .addBinding(params, "noiseScaleY", {
        min: 0,
        max: 10,
        step: 0.01,
        label: "Scale Y",
      })
      .on("change", (e) => setNoiseScaleY(e.value));
    noiseFolder
      .addBinding(params, "noiseScaleZ", {
        min: 0,
        max: 10,
        step: 0.01,
        label: "Scale Z",
      })
      .on("change", (e) => setNoiseScaleZ(e.value));
    noiseFolder
      .addBinding(params, "noiseSpeed", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Speed",
      })
      .on("change", (e) => setNoiseSpeed(e.value));
    noiseFolder
      .addBinding(params, "noiseRateX", {
        min: 0,
        max: 10,
        step: 0.1,
        label: "Rate X",
      })
      .on("change", (e) => setNoiseRateX(e.value));
    noiseFolder
      .addBinding(params, "noiseRateY", {
        min: 0,
        max: 10,
        step: 0.1,
        label: "Rate Y",
      })
      .on("change", (e) => setNoiseRateY(e.value));
    noiseFolder
      .addBinding(params, "noiseRateZ", {
        min: 0,
        max: 10,
        step: 0.1,
        label: "Rate Z",
      })
      .on("change", (e) => setNoiseRateZ(e.value));
    noiseFolder
      .addBinding(params, "noiseSharpness", {
        min: 0.1,
        max: 10,
        step: 0.1,
        label: "Sharpness",
      })
      .on("change", (e) => setNoiseSharpness(e.value));
    noiseFolder
      .addBinding(params, "gridScale", {
        min: 0.01,
        max: 1,
        step: 0.01,
        label: "Grid Scale",
      })
      .on("change", (e) => setGridScale(e.value));
    noiseFolder
      .addBinding(params, "gridAmount", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Grid Amount",
      })
      .on("change", (e) => setGridAmount(e.value));

    const wrapFolder = pane.addFolder({ title: "Wrap", expanded: false });
    wrapFolder
      .addBinding(params, "wrapCubeSizeX", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "Cube Size X",
      })
      .on("change", (e) => setWrapCubeSizeX(e.value));
    wrapFolder
      .addBinding(params, "wrapCubeSizeY", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "Cube Size Y",
      })
      .on("change", (e) => setWrapCubeSizeY(e.value));
    wrapFolder
      .addBinding(params, "wrapCubeSizeZ", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "Cube Size Z",
      })
      .on("change", (e) => setWrapCubeSizeZ(e.value));
    wrapFolder
      .addBinding(params, "moveSpeedX", {
        min: -10,
        max: 10,
        step: 0.1,
        label: "Move Speed X",
      })
      .on("change", (e) => setMoveSpeedX(e.value));
    wrapFolder
      .addBinding(params, "moveSpeedY", {
        min: -10,
        max: 10,
        step: 0.1,
        label: "Move Speed Y",
      })
      .on("change", (e) => setMoveSpeedY(e.value));
    wrapFolder
      .addBinding(params, "moveSpeedZ", {
        min: -10,
        max: 10,
        step: 0.1,
        label: "Move Speed Z",
      })
      .on("change", (e) => setMoveSpeedZ(e.value));

    const fogFolder = pane.addFolder({ title: "Fog", expanded: false });
    fogFolder
      .addBinding(params, "fogStart", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "Start",
      })
      .on("change", (e) => setFogStart(e.value));
    fogFolder
      .addBinding(params, "fogEnd", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "End",
      })
      .on("change", (e) => setFogEnd(e.value));
    fogFolder
      .addBinding(params, "fogAmount", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Amount",
      })
      .on("change", (e) => setFogAmount(e.value));

    const lightingFolder = pane.addFolder({
      title: "Lighting",
      expanded: false,
    });
    lightingFolder
      .addBinding(params, "lightingEnabled", { label: "Enabled" })
      .on("change", (e) => setLightingEnabled(e.value));
    controlRefs.ambientLightIntensity = lightingFolder
      .addBinding(params, "ambientLightIntensity", {
        min: 0,
        max: 1,
        step: 0.01,
        label: "Ambient Intensity",
      })
      .on("change", (e) => setAmbientLightIntensity(e.value));
    controlRefs.lightColor = lightingFolder
      .addBinding(params, "lightColor", { label: "Color" })
      .on("change", (e) => setLightColor(e.value));
    controlRefs.lightIntensity = lightingFolder
      .addBinding(params, "lightIntensity", {
        min: 0,
        max: 10,
        step: 0.1,
        label: "Intensity",
      })
      .on("change", (e) => setLightIntensity(e.value));
    controlRefs.lightX = lightingFolder
      .addBinding(params, "lightX", {
        min: -10,
        max: 10,
        step: 0.01,
        label: "X",
      })
      .on("change", (e) => setLightX(e.value));
    controlRefs.lightY = lightingFolder
      .addBinding(params, "lightY", {
        min: -10,
        max: 10,
        step: 0.01,
        label: "Y",
      })
      .on("change", (e) => setLightY(e.value));
    controlRefs.lightZ = lightingFolder
      .addBinding(params, "lightZ", {
        min: -10,
        max: 10,
        step: 0.01,
        label: "Z",
      })
      .on("change", (e) => setLightZ(e.value));
    controlRefs.lightRadius = lightingFolder
      .addBinding(params, "lightRadius", {
        min: 0,
        max: 10,
        step: 0.01,
        label: "Radius",
      })
      .on("change", (e) => setLightRadius(e.value));

    const focusFolder = pane.addFolder({ title: "Focus", expanded: false });
    focusFolder
      .addBinding(params, "focusFocalDistance", {
        min: 0,
        max: 100,
        step: 0.1,
        label: "Focal Distance",
      })
      .on("change", (e) => setFocusFocalDistance(e.value));
    focusFolder
      .addBinding(params, "focusFocalDepth", {
        min: 0.01,
        max: 20,
        step: 0.01,
        label: "Focal Depth",
      })
      .on("change", (e) => setFocusFocalDepth(e.value));
    focusFolder
      .addBinding(params, "focusMaxSize", {
        min: 1,
        max: 10,
        step: 0.01,
        label: "Max Size",
      })
      .on("change", (e) => setFocusMaxSize(e.value));

    const animationFolder = pane.addFolder({
      title: "Animation",
      expanded: false,
    });
    animationFolder.addButton({ title: "Add key" }).on("click", () => {
      const state = sceneRef.current?.getState();
      if (state) {
        setAnimationStates((prev) => [...prev, state]);
      }
    });
    animationFolder
      .addButton({ title: "Clear keys" })
      .on("click", () => setAnimationStates([]));
    animationFolder
      .addBinding(params, "playAnimation", { label: "Play Animation" })
      .on("change", (e) => setPlayAnimation(e.value));
    animationFolder
      .addBinding(params, "animationSpeed", {
        min: 0.1,
        max: 5,
        step: 0.1,
        label: "Speed",
      })
      .on("change", (e) => setAnimationSpeed(e.value));
    animationFolder
      .addBinding(params, "perfectLoop", { label: "Perfect Loop" })
      .on("change", (e) => setPerfectLoop(e.value));
    animationFolder
      .addBinding(params, "animateParams", { label: "Animate Params" })
      .on("change", (e) => setAnimateParams(e.value));

    const videoFolder = pane.addFolder({ title: "Video", expanded: false });
    videoFolder
      .addBinding(params, "videoResolution", {
        label: "Resolution",
        options: { "1280": 1280, "1920": 1920, "2560": 2560, "3840": 3840 },
      })
      .on("change", (e) => setVideoResolution(e.value));
    videoFolder
      .addBinding(params, "videoFramerate", {
        label: "Framerate",
        options: { "24": 24, "30": 30, "60": 60 },
      })
      .on("change", (e) => setVideoFramerate(e.value));
    videoFolder
      .addBinding(params, "videoBitrate", {
        min: 10,
        max: 150,
        step: 10,
        label: "Bitrate (Mbps)",
      })
      .on("change", (e) => setVideoBitrate(e.value));
    videoFolder
      .addBinding(params, "autoStopMode", {
        label: "Auto-stop Mode",
        options: {
          Manual: "Manual",
          "One Loop": "One Loop",
          Duration: "Duration",
        },
      })
      .on("change", (e) => setAutoStopMode(e.value));
    videoFolder
      .addBinding(params, "videoDuration", {
        min: 1,
        max: 300,
        step: 1,
        label: "Duration (s)",
      })
      .on("change", (e) => setVideoDuration(e.value));
    videoFolder
      .addButton({ title: isRecording ? "Stop Recording" : "Start Recording" })
      .on("click", () => {
        if (isRecording) {
          handleStopRecording();
        } else {
          if (!sceneRef.current) return;
          sceneRef.current.startRecording(
            params.videoResolution,
            params.videoFramerate,
            params.videoBitrate * 1000000,
            params.autoStopMode,
            params.videoDuration
          );
          setIsRecording(true);
        }
      });
    controlRefs.recordingProgress = videoFolder.addBinding(
      params,
      "recordingProgress",
      {
        disabled: true,
        label: "Progress",
      }
    );

    const imageFolder = pane.addFolder({ title: "Image", expanded: false });
    imageFolder
      .addBinding(params, "imageName", { label: "File Name" })
      .on("change", (e) => setImageName(e.value));
    imageFolder
      .addBinding(params, "exportSize", {
        label: "Export Size",
        options: { "2000": 2000, "4000": 4000, "6000": 6000, "8000": 8000 },
      })
      .on("change", (e) => setExportSize(e.value));
    imageFolder.addButton({ title: "Export" }).on("click", () => {
      if (sceneRef.current) {
        sceneRef.current.exportImage(params.imageName);
      }
    });

    return () => {
      pane.dispose();
      paneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  useEffect(() => {
    Object.values(controlRefs).forEach((control) => {
      if (
        [
          "ambientLightIntensity",
          "lightColor",
          "lightIntensity",
          "lightX",
          "lightY",
          "lightZ",
          "lightRadius",
        ].includes(control.key)
      ) {
        control.hidden = !lightingEnabled;
      }
    });
  }, [lightingEnabled, controlRefs]);

  useEffect(() => {
    if (controlRefs.recordingProgress) {
      controlRefs.recordingProgress.hidden = !(
        isRecording && autoStopMode !== "Manual"
      );
    }
  }, [isRecording, autoStopMode, controlRefs.recordingProgress]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const filename = file.name.toLowerCase();
      let format;
      if (filename.endsWith(".ply")) {
        format = GaussianSplats3D.SceneFormat.Ply;
      } else if (filename.endsWith(".splat")) {
        format = GaussianSplats3D.SceneFormat.Splat;
      } else if (filename.endsWith(".ksplat")) {
        format = GaussianSplats3D.SceneFormat.KSplat;
      } else {
        alert(
          "Unsupported file format. Please select a .ply, .splat, or .ksplat file."
        );
        return;
      }

      const url = URL.createObjectURL(file);

      setSplatSource({ url, format });

      event.target.value = "";
    }
  };

  const [w, h] = aspectRatio.split(":").map(Number);
  const ratio = w / h;

  return (
    <>
      <div className="relative w-screen h-screen flex items-center justify-center bg-black">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".ply,.ksplat,.splat"
          onChange={handleFileChange}
        />
        <div
          className="relative"
          style={{
            width: "100vw",
            height: `calc(100vw / ${ratio})`,
            maxWidth: `calc(100vh * ${ratio})`,
            maxHeight: "100vh",
          }}
        >
          <Canvas gl={{ preserveDrawingBuffer: true }} dpr={dpr}>
            <color
              attach="background"
              args={[
                background.r / 255,
                background.g / 255,
                background.b / 255,
              ]}
            />
            <PerformanceMonitor
              onIncline={() => {
                if (!isRecording) setDpr(2);
              }}
              onDecline={() => {
                if (!isRecording) setDpr(1);
              }}
            />
            <Scene
              ref={sceneRef}
              onRecordingFinish={handleStopRecording}
              onRecordingProgress={(progress) =>
                setRecordingProgress(`${Math.round(progress * 100)}%`)
              }
            />
          </Canvas>
        </div>
      </div>
    </>
  );
}
