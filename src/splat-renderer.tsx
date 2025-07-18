// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { useEffect, useState } from "react";
import { Group, Mesh, ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import type { SplatParams } from "./app";
import { fragmentShader } from "./fragment-shader";
import { vertexShader } from "./vertex-shader";

export function SplatRenderer({
  sources,
  splatParams,
  splatAlphaRemovalThreshold,
}: {
  sources: { url: string; format: GaussianSplats3D.SceneFormat }[];
  splatParams: SplatParams;
  splatAlphaRemovalThreshold: number;
}) {
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

  useFrame((_, delta) => {
    viewer.traverse((obj: unknown) => {
      if (!(obj as Mesh).isMesh) return;
      const mat = (obj as Mesh).material as ShaderMaterial;
      if (!mat || !mat.uniforms || !mat.uniforms.time) return;
      mat.uniforms.time.value += delta;
    });
  });

  useEffect(() => {
    const viewer = new GaussianSplats3D.DropInViewer({
      showLoadingUI: false,
      splatRenderMode: GaussianSplats3D.SplatRenderMode.ThreeD,
      sphericalHarmonicsDegree: 2,
      antialiased: true,
      splatAlphaRemovalThreshold,
    });
    const updateShader = () => {
      viewer.traverse((obj: unknown) => {
        if (!(obj as Mesh).isMesh) return;
        const mat = (obj as Mesh).material as ShaderMaterial;
        if (!mat || !mat.uniforms) return; // ignore non‑shader materials

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
      });
    };
    const addParams: { path: string }[] = sources.map(({ url, format }) => ({
      path: url,
      format,
    }));
    viewer
      .addSplatScenes(addParams, false)
      .then(updateShader)
      .catch((err: unknown) => {
        console.log("Error loading splat scenes:", err);
      });

    setViewer(viewer);

    return () => void viewer.dispose();
  }, []);

  useEffect(() => {
    viewer.traverse((obj: unknown) => {
      if (!(obj as Mesh).isMesh) return;
      const mat = (obj as Mesh).material as ShaderMaterial;
      if (!mat || !mat.uniforms) return;
      if (mat.uniforms.noisiness) mat.uniforms.noisiness.value = 1 - noisiness;
      if (mat.uniforms.ditherGranularity)
        mat.uniforms.ditherGranularity.value = ditherGranularity;
      if (mat.uniforms.noiseScale)
        mat.uniforms.noiseScale.value = [noiseScaleX, noiseScaleY, noiseScaleZ];
      if (mat.uniforms.noiseSpeed) mat.uniforms.noiseSpeed.value = noiseSpeed;
      if (mat.uniforms.noiseRate)
        mat.uniforms.noiseRate.value = [noiseRateX, noiseRateY, noiseRateZ];
      if (mat.uniforms.noiseSharpness)
        mat.uniforms.noiseSharpness.value = noiseSharpness;
      if (mat.uniforms.gridScale) mat.uniforms.gridScale.value = gridScale;
      if (mat.uniforms.gridAmount) mat.uniforms.gridAmount.value = gridAmount;
      if (mat.uniforms.fogStart) mat.uniforms.fogStart.value = fogStart;
      if (mat.uniforms.fogEnd) mat.uniforms.fogEnd.value = fogEnd;
      if (mat.uniforms.fogAmount) mat.uniforms.fogAmount.value = fogAmount;
    });
  }, [
    noisiness,
    ditherGranularity,
    noiseScaleX,
    noiseScaleY,
    noiseScaleZ,
    noiseSpeed,
    viewer,
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

  return <primitive object={viewer} />;
}
