// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  PerspectiveCamera,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { SplatRenderer } from "./splat-renderer";
import type { SplatParams } from "./app";

const { ACTION } = CameraControlsImpl;

export const Scene = forwardRef<
  {
    exportImage: (filename: string) => void;
    getCameraState: () => {
      position: Vector3;
      quaternion: Quaternion;
      zoom: number;
    } | null;
  },
  {
    splatSource: {
      url: string;
      format: GaussianSplats3D.SceneFormat;
    } | null;
    exportSize: number;
    ratio: number;
    cameraStates: { position: Vector3; quaternion: Quaternion; zoom: number }[];
    playAnimation: boolean;
    animationSpeed: number;
    splatParams: SplatParams;
    splatAlphaRemovalThreshold: number;
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
    },
    ref
  ) => {
    const { gl, scene, camera } = useThree();
    const controlsRef = useRef<CameraControlsImpl>(null);

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
        const zoom = (controlsRef.current.camera as PerspectiveCamera).zoom;
        return { position, quaternion: camera.quaternion.clone(), zoom };
      },
    }));

    const { positionCurve, zoomCurve } = useMemo(() => {
      if (cameraStates.length < 2) {
        return { positionCurve: null, zoomCurve: null };
      }
      const points = cameraStates.map((s) => s.position);
      const zooms = cameraStates.map((s) => s.zoom);

      // For a closed loop, CatmullRomCurve3 doesn't need the first point repeated at the end.
      const posCurve = new CatmullRomCurve3(points, true, "catmullrom", 0.5);

      // We will handle zoom interpolation within the segments.
      return { positionCurve: posCurve, zoomCurve: zooms };
    }, [cameraStates]);

    const animationState = useRef({
      progress: 0,
    });

    useFrame((_, delta) => {
      if (!controlsRef.current) return;

      if (
        !playAnimation ||
        cameraStates.length < 2 ||
        !positionCurve ||
        !zoomCurve
      ) {
        if (!controlsRef.current.enabled) {
          controlsRef.current.enabled = true;
          // sync zoom back to controls
          (controlsRef.current.camera as PerspectiveCamera).zoom = (
            camera as PerspectiveCamera
          ).zoom;
          controlsRef.current.updateCameraUp();
        }
        animationState.current.progress = 0;
        return;
      }

      controlsRef.current.enabled = false;

      animationState.current.progress +=
        (delta * animationSpeed * 0.1) / cameraStates.length;
      if (animationState.current.progress > 1) {
        animationState.current.progress = 0;
      }
      const t = animationState.current.progress;

      // Position from Catmull-Rom curve
      positionCurve.getPointAt(t, camera.position);

      // For rotation and zoom, we find the current segment and progress within it
      const segmentCount = cameraStates.length;
      const scaledT = t * segmentCount;
      const currentIndex = Math.floor(scaledT);
      const segmentProgress = scaledT - currentIndex;

      // Smoother step for slerp and lerp
      const smoothSegmentProgress =
        segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

      const start = cameraStates[currentIndex];
      const end = cameraStates[(currentIndex + 1) % segmentCount];

      camera.quaternion.slerpQuaternions(
        start.quaternion,
        end.quaternion,
        smoothSegmentProgress
      );

      (camera as PerspectiveCamera).zoom =
        start.zoom * (1 - smoothSegmentProgress) +
        end.zoom * smoothSegmentProgress;

      camera.updateProjectionMatrix();
    });

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
            <SplatRenderer
              sources={[splatSource]}
              splatParams={splatParams}
              splatAlphaRemovalThreshold={splatAlphaRemovalThreshold}
            />
          </group>
        )}
      </>
    );
  }
);
