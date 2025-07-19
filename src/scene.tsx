// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as HME from "h264-mp4-encoder";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CatmullRomCurve3,
  Group,
  PerspectiveCamera,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import type { CameraState, SceneRef, SplatParams } from "./app";
import { fragmentShader } from "./fragment-shader";
import { vertexShader } from "./vertex-shader";
const { ACTION } = CameraControlsImpl;

type Uniforms = Record<string, { value: any }>;

export const Scene = forwardRef<
  SceneRef,
  {
    splatSource: {
      url: string;
      format: GaussianSplats3D.SceneFormat;
    } | null;
    exportSize: number;
    ratio: number;
    cameraStates: CameraState[];
    playAnimation: boolean;
    animationSpeed: number;
    splatParams: SplatParams;
    splatAlphaRemovalThreshold: number;
    onRecordingFinish: () => void;
    perfectLoop: boolean;
  }
>(
  (
    {
      splatSource,
      exportSize,
      ratio,
      cameraStates,
      playAnimation,
      animationSpeed,
      splatParams,
      splatAlphaRemovalThreshold,
      onRecordingFinish,
      perfectLoop,
    },
    ref
  ) => {
    const { gl, scene, camera } = useThree();
    const controlsRef = useRef<CameraControlsImpl>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [autoStopMode, setAutoStopMode] = useState("Manual");
    const [autoStopDuration, setAutoStopDuration] = useState(0);
    // Update encoder reference type
    const encoderRef = useRef<HME.H264MP4Encoder | null>(null);
    const originalSizeRef = useRef<Vector2 | null>(null);
    const originalPixelRatioRef = useRef<number | null>(null);

    const {
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
    } = splatParams;
    const [viewer, setViewer] = useState<Group>(new Group());
    const [uniforms, setUniforms] = useState<Uniforms | null>(null);

    useEffect(() => {
      if (!splatSource) return;

      const viewer = new GaussianSplats3D.DropInViewer({
        showLoadingUI: false,
        splatRenderMode: GaussianSplats3D.SplatRenderMode.ThreeD,
        sphericalHarmonicsDegree: 2,
        antialiased: true,
        splatAlphaRemovalThreshold,
      });
      const updateShader = () => {
        const mat = viewer.splatMesh.material as ShaderMaterial;

        // 1. add a uniform and a compile‑time flag
        mat.uniforms.ditherScale = { value: 1.0 };
        mat.uniforms.noisiness = { value: 0.8 };
        mat.uniforms.ditherGranularity = { value: 1.0 };
        mat.uniforms.time = { value: 0.0 };
        mat.uniforms.noiseScale = { value: [0, 0, 0] };
        mat.uniforms.noiseSpeed = { value: 0.1 };
        mat.uniforms.noiseRate = { value: [1, 1, 1] };
        mat.uniforms.noiseSharpness = { value: 1.0 };
        mat.uniforms.gridScale = { value: 0.1 };
        mat.uniforms.gridAmount = { value: 0.0 };
        mat.uniforms.fogStart = { value: 0.0 };
        mat.uniforms.fogEnd = { value: 0.0 };
        mat.uniforms.fogAmount = { value: 0.0 };
        mat.defines = { ...(mat.defines || {}), DITHERED_ALPHA: "" };

        // 2. patch the shader just once
        if (!mat.userData._ditherPatched) {
          mat.onBeforeCompile = (shader) => {
            shader.fragmentShader = fragmentShader;
            shader.vertexShader = vertexShader;
          };
          mat.userData._ditherPatched = true;
          mat.needsUpdate = true;
        }

        setUniforms(mat.uniforms);
      };

      viewer
        .addSplatScenes(
          [
            {
              path: splatSource.url,
              format: splatSource.format,
            },
          ],
          false
        )
        .then(updateShader)
        .catch((err: unknown) => {
          console.log("Error loading splat scenes:", err);
        });

      setViewer(viewer);

      return () => void viewer.dispose();
    }, [splatAlphaRemovalThreshold, splatSource]);

    useEffect(() => {
      if (!uniforms) return;

      if (uniforms.noisiness) uniforms.noisiness.value = 1 - noisiness;
      if (uniforms.ditherGranularity)
        uniforms.ditherGranularity.value = ditherGranularity;
      if (uniforms.noiseScale)
        uniforms.noiseScale.value = [noiseScaleX, noiseScaleY, noiseScaleZ];
      if (uniforms.noiseSpeed) uniforms.noiseSpeed.value = noiseSpeed;
      if (uniforms.noiseRate)
        uniforms.noiseRate.value = [noiseRateX, noiseRateY, noiseRateZ];
      if (uniforms.noiseSharpness)
        uniforms.noiseSharpness.value = noiseSharpness;
      if (uniforms.gridScale) uniforms.gridScale.value = gridScale;
      if (uniforms.gridAmount) uniforms.gridAmount.value = gridAmount;
      if (uniforms.fogStart) uniforms.fogStart.value = fogStart;
      if (uniforms.fogEnd) uniforms.fogEnd.value = fogEnd;
      if (uniforms.fogAmount) uniforms.fogAmount.value = fogAmount;
    }, [
      noisiness,
      ditherGranularity,
      noiseScaleX,
      noiseScaleY,
      noiseScaleZ,
      noiseSpeed,
      uniforms,
      noiseRateX,
      noiseRateY,
      noiseRateZ,
      noiseSharpness,
      gridScale,
      gridAmount,
      fogStart,
      fogEnd,
      fogAmount,
    ]);

    useEffect(() => {
      // No need for initialization here as we'll initialize on demand
      return () => {
        // Clean up encoder if component unmounts during recording
        if (encoderRef.current) {
          encoderRef.current.delete();
          encoderRef.current = null;
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      exportImage: (filename: string) => {
        const originalSize = new Vector2();
        gl.getSize(originalSize);
        const originalPixelRatio = gl.getPixelRatio();

        let width, height;
        if (ratio >= 1) {
          width = exportSize;
          height = exportSize / ratio;
        } else {
          width = exportSize * ratio;
          height = exportSize;
        }
        gl.setSize(width, height);
        gl.setPixelRatio(1);

        gl.render(scene, camera);

        const link = document.createElement("a");
        link.download = `${filename}.png`;
        link.href = gl.domElement.toDataURL("image/png");
        link.click();

        // Restore original size and pixel ratio
        gl.setSize(originalSize.x, originalSize.y);
        gl.setPixelRatio(originalPixelRatio);
      },
      getCameraState: () => {
        if (!controlsRef.current) return null;
        const position = new Vector3();
        controlsRef.current.getPosition(position);
        const target = new Vector3();
        controlsRef.current.getTarget(target);
        const zoom = (controlsRef.current.camera as PerspectiveCamera).zoom;
        return {
          position,
          quaternion: camera.quaternion.clone(),
          target,
          zoom,
        };
      },
      startRecording: async (
        width: number,
        framerate: number,
        bitrate: number,
        mode: string,
        duration?: number
      ) => {
        try {
          // Create encoder using the updated API
          encoderRef.current = await HME.createH264MP4Encoder();

          let videoWidth: number, videoHeight: number;
          if (ratio >= 1) {
            videoWidth = width;
            videoHeight = width / ratio;
          } else {
            videoWidth = width * ratio;
            videoHeight = width;
          }

          // Ensure width and height are multiples of 2 as required by the encoder
          videoWidth = Math.floor(videoWidth / 2) * 2;
          videoHeight = Math.floor(videoHeight / 2) * 2;

          encoderRef.current.width = videoWidth;
          encoderRef.current.height = videoHeight;
          encoderRef.current.frameRate = framerate;
          // Convert bitrate from bps to kbps as expected by the encoder
          encoderRef.current.kbps = Math.floor(bitrate / 1000);
          encoderRef.current.speed = 10;
          encoderRef.current.quantizationParameter = 10;
          encoderRef.current.initialize();

          // Store original size and pixel ratio
          originalSizeRef.current = new Vector2();
          gl.getSize(originalSizeRef.current);
          originalPixelRatioRef.current = gl.getPixelRatio();

          // Set recording size
          gl.setSize(videoWidth, videoHeight);
          gl.setPixelRatio(1);
          animationState.current.progress = 0; // Reset animation for recording
          uniforms!.time.value = 0; // Reset time uniform
          setAutoStopMode(mode);
          setAutoStopDuration(duration || 0);
          setIsRecording(true);
        } catch (error) {
          console.error("Failed to start recording:", error);
          alert(
            "Failed to start recording. H.264 encoding may not be supported in this browser."
          );

          if (encoderRef.current) {
            encoderRef.current.delete();
            encoderRef.current = null;
          }
        }
      },
      stopRecording: async (filename: string) => {
        if (encoderRef.current) {
          setIsRecording(false);
          setAutoStopMode("Manual");

          try {
            encoderRef.current.finalize();
            const buffer = encoderRef.current.FS.readFile(
              encoderRef.current.outputFilename
            );
            const blob = new Blob([buffer], { type: "video/mp4" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error("Error finalizing video:", error);
            alert("Failed to generate the video.");
          } finally {
            // Always clean up the encoder
            encoderRef.current.delete();
            encoderRef.current = null;

            // Restore original size and pixel ratio
            if (originalSizeRef.current && originalPixelRatioRef.current) {
              gl.setSize(originalSizeRef.current.x, originalSizeRef.current.y);
              gl.setPixelRatio(originalPixelRatioRef.current);
              originalSizeRef.current = null;
              originalPixelRatioRef.current = null;
            }
          }
        }
      },
    }));

    const { positionCurve, targetCurve, zoomCurve } = useMemo(() => {
      if (cameraStates.length < 2) {
        return { positionCurve: null, targetCurve: null, zoomCurve: null };
      }
      const points = cameraStates.map((s) => s.position);
      const targets = cameraStates.map((s) => s.target);
      const zooms = cameraStates.map((s) => s.zoom);

      // For a closed loop, CatmullRomCurve3 doesn't need the first point repeated at the end.
      const posCurve = new CatmullRomCurve3(points, true, "catmullrom", 0.5);
      const tgtCurve = new CatmullRomCurve3(targets, true, "catmullrom", 0.5);

      // We will handle zoom interpolation within the segments.
      return {
        positionCurve: posCurve,
        targetCurve: tgtCurve,
        zoomCurve: zooms,
      };
    }, [cameraStates]);

    const animationState = useRef({
      progress: 0,
    });

    useFrame((_, delta) => {
      let animationDelta = delta;
      if (isRecording && encoderRef.current) {
        // Use fixed delta for recording
        animationDelta = 1 / encoderRef.current.frameRate;
      }

      // Animation update logic
      if (
        playAnimation &&
        cameraStates.length >= 2 &&
        positionCurve &&
        targetCurve &&
        zoomCurve
      ) {
        if (controlsRef.current) controlsRef.current.enabled = false;

        animationState.current.progress +=
          (animationDelta * animationSpeed * 0.1) / cameraStates.length;
        if (animationState.current.progress > 1) {
          animationState.current.progress = 0;
          if (isRecording && autoStopMode === "One Loop") {
            onRecordingFinish();
          }
        }
        const t = animationState.current.progress;

        // Position and target from Catmull-Rom curves
        positionCurve.getPointAt(t, camera.position);
        const target = targetCurve.getPointAt(t);
        camera.lookAt(target);

        // For zoom, we find the current segment and progress within it
        const segmentCount = cameraStates.length;
        const scaledT = t * segmentCount;
        const currentIndex = Math.floor(scaledT);
        const segmentProgress = scaledT - currentIndex;

        // Smoother step for lerp
        const smoothSegmentProgress =
          segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

        const start = cameraStates[currentIndex];
        const end = cameraStates[(currentIndex + 1) % segmentCount];

        (camera as PerspectiveCamera).zoom =
          start.zoom * (1 - smoothSegmentProgress) +
          end.zoom * smoothSegmentProgress;

        camera.updateProjectionMatrix();
      } else {
        if (controlsRef.current && !controlsRef.current.enabled) {
          controlsRef.current.enabled = true;
          // sync zoom back to controls
          (controlsRef.current.camera as PerspectiveCamera).zoom = (
            camera as PerspectiveCamera
          ).zoom;
          controlsRef.current.updateCameraUp();
        }

        animationState.current.progress = 0;
      }

      if (uniforms?.time) {
        if (playAnimation && perfectLoop && cameraStates.length >= 2) {
          const progress = animationState.current.progress;
          const pingPongProgress = 1 - Math.abs(progress * 2 - 1);
          const loopDuration =
            cameraStates.length / (animationSpeed * 0.1 * 0.5);
          uniforms.time.value = pingPongProgress * loopDuration;
        } else {
          uniforms.time.value += animationDelta;
        }
      }

      gl.render(scene, camera);

      // Frame capture logic for recording
      if (isRecording && encoderRef.current) {
        if (
          autoStopMode === "Duration" &&
          uniforms?.time.value >= autoStopDuration
        ) {
          onRecordingFinish();
        }

        const width = encoderRef.current.width;
        const height = encoderRef.current.height;
        const pixels = new Uint8Array(width * height * 4);

        const context = gl.getContext();
        context.readPixels(
          0,
          0,
          width,
          height,
          context.RGBA,
          context.UNSIGNED_BYTE,
          pixels
        );

        // The framebuffer is flipped vertically, so we need to flip it back
        const flippedPixels = new Uint8Array(width * height * 4);
        for (let y = 0; y < height; y++) {
          const row = pixels.subarray(y * width * 4, (y + 1) * width * 4);
          flippedPixels.set(row, (height - 1 - y) * width * 4);
        }

        encoderRef.current.addFrameRgba(flippedPixels);
      }
    }, 1);

    return (
      <>
        <CameraControls
          ref={controlsRef}
          mouseButtons={{
            left: ACTION.ROTATE,
            middle: ACTION.DOLLY,
            right: ACTION.TRUCK,
            wheel: ACTION.ZOOM,
          }}
          infinityDolly
          dollyToCursor
          minDistance={10}
          maxDistance={10}
        />
        <ambientLight intensity={Math.PI / 2} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        {splatSource && (
          <group rotation={[0, 0, Math.PI]}>
            <primitive object={viewer} />
          </group>
        )}
      </>
    );
  }
);
