// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { Canvas } from "@react-three/fiber";
import { useAtom, useSetAtom } from "jotai";
import { button, folder, Leva, useControls } from "leva";
import { useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { Scene } from "./scene";
import {
  animationSpeedAtom,
  aspectRatioAtom,
  autoStopModeAtom,
  backgroundAtom,
  cameraStatesAtom,
  ditherGranularityAtom,
  exportSizeAtom,
  fogAmountAtom,
  fogEndAtom,
  fogStartAtom,
  gridAmountAtom,
  gridScaleAtom,
  imageNameAtom,
  isRecordingAtom,
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

export type CameraState = {
  position: Vector3;
  quaternion: Quaternion;
  target: Vector3;
  zoom: number;
};

export type SceneRef = {
  exportImage: (filename: string) => void;
  getCameraState: () => CameraState | null;
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

  const setCameraStates = useSetAtom(cameraStatesAtom);

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
  const [playAnimation, setPlayAnimation] = useAtom(playAnimationAtom);
  const [animationSpeed, setAnimationSpeed] = useAtom(animationSpeedAtom);
  const [perfectLoop, setPerfectLoop] = useAtom(perfectLoopAtom);
  const [videoResolution, setVideoResolution] = useAtom(videoResolutionAtom);
  const [videoFramerate, setVideoFramerate] = useAtom(videoFramerateAtom);
  const [videoBitrate, setVideoBitrate] = useAtom(videoBitrateAtom);
  const [autoStopMode, setAutoStopMode] = useAtom(autoStopModeAtom);
  const [videoDuration, setVideoDuration] = useAtom(videoDurationAtom);
  const [imageName, setImageName] = useAtom(imageNameAtom);
  const [exportSize, setExportSize] = useAtom(exportSizeAtom);

  const [, set] = useControls(
    () => ({
      Import: folder({
        "Load Splat": button(() => fileInputRef.current?.click()),
      }),
      Splats: folder({
        splatAlphaRemovalThreshold: {
          value: splatAlphaRemovalThreshold,
          min: 0,
          max: 255,
          step: 1,
          label: "Alpha Threshold",
          onChange: setSplatAlphaRemovalThreshold,
        },
        splatSizeThreshold: {
          value: splatSizeThreshold,
          min: 0,
          max: 1000,
          step: 1,
          label: "Size Threshold",
          onChange: setSplatSizeThreshold,
        },
        splatScale: {
          value: splatScale,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: "Scale",
          onChange: setSplatScale,
        },
      }),
      Canvas: folder(
        {
          background: {
            value: background,
            label: "Background Color",
            onChange: setBackground,
          },
          aspectRatio: {
            options: ["16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3"],
            value: aspectRatio,
            label: "Aspect Ratio",
            onChange: setAspectRatio,
          },
        },
        {
          collapsed: true,
        }
      ),
      Grain: folder(
        {
          noisiness: {
            value: noisiness,
            min: 0,
            max: 1,
            step: 0.01,
            label: "Amount",
            onChange: setNoisiness,
          },
          ditherGranularity: {
            value: ditherGranularity,
            min: 1,
            max: 1000000,
            step: 1,
            label: "Hash",
            onChange: setDitherGranularity,
          },
        },
        {
          collapsed: true,
        }
      ),
      Noise: folder(
        {
          noiseScaleX: {
            value: noiseScaleX,
            min: 0,
            max: 10,
            step: 0.01,
            label: "Scale X",
            onChange: setNoiseScaleX,
          },
          noiseScaleY: {
            value: noiseScaleY,
            min: 0,
            max: 10,
            step: 0.01,
            label: "Scale Y",
            onChange: setNoiseScaleY,
          },
          noiseScaleZ: {
            value: noiseScaleZ,
            min: 0,
            max: 10,
            step: 0.01,
            label: "Scale Z",
            onChange: setNoiseScaleZ,
          },
          noiseSpeed: {
            value: noiseSpeed,
            min: 0,
            max: 1,
            step: 0.01,
            label: "Speed",
            onChange: setNoiseSpeed,
          },
          noiseRateX: {
            value: noiseRateX,
            min: 0,
            max: 10,
            step: 0.1,
            label: "Rate X",
            onChange: setNoiseRateX,
          },
          noiseRateY: {
            value: noiseRateY,
            min: 0,
            max: 10,
            step: 0.1,
            label: "Rate Y",
            onChange: setNoiseRateY,
          },
          noiseRateZ: {
            value: noiseRateZ,
            min: 0,
            max: 10,
            step: 0.1,
            label: "Rate Z",
            onChange: setNoiseRateZ,
          },
          noiseSharpness: {
            value: noiseSharpness,
            min: 0.1,
            max: 10,
            step: 0.1,
            label: "Sharpness",
            onChange: setNoiseSharpness,
          },
          gridScale: {
            value: gridScale,
            min: 0.01,
            max: 1,
            step: 0.01,
            label: "Grid Scale",
            onChange: setGridScale,
          },
          gridAmount: {
            value: gridAmount,
            min: 0,
            max: 1,
            step: 0.01,
            label: "Grid Amount",
            onChange: setGridAmount,
          },
        },
        {
          collapsed: true,
        }
      ),
      Wrap: folder(
        {
          wrapCubeSizeX: {
            value: wrapCubeSizeX,
            min: 0,
            max: 100,
            step: 0.1,
            label: "Size X",
            onChange: setWrapCubeSizeX,
          },
          wrapCubeSizeY: {
            value: wrapCubeSizeY,
            min: 0,
            max: 100,
            step: 0.1,
            label: "Size Y",
            onChange: setWrapCubeSizeY,
          },
          wrapCubeSizeZ: {
            value: wrapCubeSizeZ,
            min: 0,
            max: 100,
            step: 0.1,
            label: "Size Z",
            onChange: setWrapCubeSizeZ,
          },
        },
        {
          collapsed: true,
        }
      ),
      Fog: folder(
        {
          fogStart: {
            value: fogStart,
            min: 0,
            max: 100,
            step: 0.1,
            label: "Start",
            onChange: setFogStart,
          },
          fogEnd: {
            value: fogEnd,
            min: 0,
            max: 100,
            step: 0.1,
            label: "End",
            onChange: setFogEnd,
          },
          fogAmount: {
            value: fogAmount,
            min: 0,
            max: 1,
            step: 0.01,
            label: "Amount",
            onChange: setFogAmount,
          },
        },
        {
          collapsed: true,
        }
      ),
      Animation: folder(
        {
          "Add key": button(() => {
            const state = sceneRef.current?.getCameraState();
            if (state) {
              setCameraStates((prev) => [...prev, state]);
            }
          }),
          "Clear keys": button(() => setCameraStates([])),
          playAnimation: {
            value: playAnimation,
            label: "Play",
            onChange: setPlayAnimation,
          },
          animationSpeed: {
            value: animationSpeed,
            min: 0.1,
            max: 5,
            step: 0.1,
            label: "Speed",
            onChange: setAnimationSpeed,
          },
          perfectLoop: {
            value: perfectLoop,
            label: "Perfect Loop",
            onChange: setPerfectLoop,
          },
        },
        {
          collapsed: true,
        }
      ),

      Video: folder(
        {
          videoResolution: {
            options: [1280, 1920, 2560, 3840],
            value: videoResolution,
            label: "Resolution (width)",
            onChange: setVideoResolution,
          },
          videoFramerate: {
            options: [24, 30, 60],
            value: videoFramerate,
            label: "Framerate",
            onChange: setVideoFramerate,
          },
          videoBitrate: {
            value: videoBitrate,
            min: 10,
            max: 150,
            step: 10,
            label: "Bitrate (Mbps)",
            onChange: setVideoBitrate,
          },
          autoStopMode: {
            options: ["Manual", "One Loop", "Duration"],
            value: autoStopMode,
            label: "Auto-stop",
            onChange: setAutoStopMode,
          },
          videoDuration: {
            value: videoDuration,
            min: 1,
            max: 300,
            step: 1,
            label: "Duration (s)",
            onChange: setVideoDuration,
          },
          "Start/Stop Recording": button((get) => {
            if (isRecording) {
              handleStopRecording();
            } else {
              if (!sceneRef.current) return;
              const width = get("Video.videoResolution");
              sceneRef.current.startRecording(
                width,
                get("Video.videoFramerate"),
                get("Video.videoBitrate") * 1000000, // Convert Mbps to bps
                get("Video.autoStopMode"),
                get("Video.videoDuration")
              );
              setIsRecording(true);
            }
          }),
          recordingProgress: {
            value: ``,
            render: () => isRecording && autoStopMode !== "Manual",
            editable: false,
            label: "Recording Progress",
          },
        },
        {
          collapsed: true,
        }
      ),

      Image: folder(
        {
          imageName: {
            value: imageName,
            label: "Image Name",
            onChange: setImageName,
          },
          exportSize: {
            options: [2000, 4000, 6000, 8000],
            value: exportSize,
            label: "Export Size (px)",
            onChange: setExportSize,
          },
          Export: button(() => {
            if (sceneRef.current) {
              sceneRef.current.exportImage(imageName);
            }
          }),
        },
        {
          collapsed: true,
        }
      ),
    }),
    [isRecording, autoStopMode]
  );

  const handleStopRecording = () => {
    if (!sceneRef.current) return;
    setIsRecording(false);
    sceneRef.current.stopRecording(imageName).then(() => {
      console.log("Recording finished");
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <Leva
        theme={{
          colors: {
            elevation1: "#00000033",
            elevation2: "#00000000",
            elevation3: "#00000088",
            highlight1: "#ffffff",
            highlight2: "#ffffff",
            highlight3: "#ffffff",
            accent1: "#727272",
            accent2: "#727272",
            accent3: "#727272",
          },
          sizes: {
            rootWidth: "350px",
          },
        }}
        titleBar={{ title: "Controls", drag: false, filter: false }}
      />

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
                set({ recordingProgress: `${Math.round(progress * 100)}%` })
              }
            />
          </Canvas>
        </div>
      </div>
    </>
  );
}
