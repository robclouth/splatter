// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { Canvas } from "@react-three/fiber";
import { button, useControls } from "leva";
import { useRef, useState } from "react";
import { Quaternion, Vector3 } from "three";
import { Scene } from "./scene";

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
};

export default function App() {
  const sceneRef = useRef<{
    exportImage: (filename: string) => void;
    getCameraState: () => {
      position: Vector3;
      quaternion: Quaternion;
      zoom: number;
    } | null;
  }>(null);

  const [cameraStates, setCameraStates] = useState<
    { position: Vector3; quaternion: Quaternion; zoom: number }[]
  >([]);

  const {
    background,
    aspectRatio,
    exportSize,
    playAnimation,
    animationSpeed,
    imageName,
    ...splatParams
  } = useControls({
    "Load Splat": button(() => fileInputRef.current?.click()),
    background: { r: 255, g: 255, b: 255, a: 1, label: "Background Color" },
    aspectRatio: {
      options: ["16:9", "4:3", "3:2", "1:1", "9:16", "3:4", "2:3"],
      value: "16:9",
      label: "Aspect Ratio",
    },

    noisiness: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Dither Amount",
    },
    ditherGranularity: {
      value: 1,
      min: 1,
      max: 1000000,
      step: 1,
      label: "Dither Granularity",
    },
    noiseScaleX: {
      value: 0,
      min: 0,
      max: 10,
      step: 0.01,
      label: "Scale X",
    },
    noiseScaleY: {
      value: 0,
      min: 0,
      max: 10,
      step: 0.01,
      label: "Scale Y",
    },
    noiseScaleZ: {
      value: 0,
      min: 0,
      max: 10,
      step: 0.01,
      label: "Scale Z",
    },
    noiseSpeed: {
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Speed",
    },
    noiseRateX: { value: 1, min: 0, max: 10, step: 0.1, label: "Rate X" },
    noiseRateY: { value: 1, min: 0, max: 10, step: 0.1, label: "Rate Y" },
    noiseRateZ: { value: 1, min: 0, max: 10, step: 0.1, label: "Rate Z" },
    noiseSharpness: {
      value: 1,
      min: 0.1,
      max: 10,
      step: 0.1,
      label: "Sharpness",
    },
    gridScale: {
      value: 0.1,
      min: 0.01,
      max: 1,
      step: 0.01,
      label: "Grid Scale",
    },
    gridAmount: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Grid Amount",
    },

    "Save Camera": button(() => {
      const state = sceneRef.current?.getCameraState();
      if (state) {
        setCameraStates((prev) => [...prev, state]);
      }
    }),
    "Clear Cameras": button(() => setCameraStates([])),
    playAnimation: {
      value: false,
      label: "Play Animation",
    },
    animationSpeed: {
      value: 1,
      min: 0.1,
      max: 5,
      step: 0.1,
      label: "Animation Speed",
    },
    imageName: { value: "export", label: "Image Name" },
    exportSize: {
      options: [2000, 4000, 6000, 8000],
      value: 4000,
      label: "Export Size (px)",
    },
    Export: button(() => {
      if (sceneRef.current) {
        sceneRef.current.exportImage(imageName);
      }
    }),
  }) as unknown as {
    background: { r: number; g: number; b: number; a: number };
    aspectRatio: string;
    exportSize: number;
    playAnimation: boolean;
    animationSpeed: number;
    imageName: string;
  } & SplatParams;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [splatSource, setSplatSource] = useState<{
    url: string;
    format: GaussianSplats3D.SceneFormat;
  } | null>(null);

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
      <div className="relative w-screen h-screen flex items-center justify-center">
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
          <Canvas gl={{ preserveDrawingBuffer: true }}>
            <color
              attach="background"
              args={[
                background.r / 255,
                background.g / 255,
                background.b / 255,
              ]}
            />
            <Scene
              ref={sceneRef}
              splatSource={splatSource}
              exportSize={exportSize}
              ratio={ratio}
              cameraStates={cameraStates}
              playAnimation={playAnimation}
              animationSpeed={animationSpeed}
              splatParams={splatParams}
            />
          </Canvas>
        </div>
      </div>
    </>
  );
}
