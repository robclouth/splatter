// @ts-ignore
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import { useEffect, useState } from "react";
import { Group, Mesh, ShaderMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import type { SplatParams } from "./app";

export function SplatRenderer({
  sources,
  splatParams,
}: {
  sources: { url: string; format: GaussianSplats3D.SceneFormat }[];
  splatParams: SplatParams;
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
    });
    // helper: add dithered‑alpha to every SplatMaterial we find
    const injectDither = () => {
      viewer.traverse((obj: unknown) => {
        if (!(obj as Mesh).isMesh) return;
        const mat = (obj as Mesh).material as ShaderMaterial;
        if (!mat || !mat.uniforms) return; // ignore non‑shader materials

        // 1. add a uniform and a compile‑time flag
        mat.uniforms.ditherScale = { value: 1.0 };
        mat.uniforms.noisiness = { value: 0.2 };
        mat.uniforms.ditherGranularity = { value: 1.0 };
        mat.uniforms.time = { value: 0.0 };
        mat.uniforms.noiseScale = { value: [0, 0, 0] };
        mat.uniforms.noiseSpeed = { value: 0.1 };
        mat.uniforms.noiseRate = { value: [1, 1, 1] };
        mat.uniforms.noiseSharpness = { value: 1.0 };
        mat.uniforms.gridScale = { value: 0.1 };
        mat.uniforms.gridAmount = { value: 0.0 };
        mat.defines = { ...(mat.defines || {}), DITHERED_ALPHA: "" };

        // 2. patch the shader just once
        if (!mat.userData._ditherPatched) {
          mat.onBeforeCompile = (shader) => {
            // bring the uniform and helper into GLSL
            shader.fragmentShader =
              `
              uniform float noisiness;
              uniform float ditherGranularity;

              float random(vec2 c) {
                return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
              }

              float whiteNoiseDither(vec2 uv, float a) {
                if (a < random(uv)) {
                    return 0.0;
                } else {
                    return 1.0;
                }
              }
                
              ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
              "float opacity = exp(-0.5 * A) * vColor.a;",
              `
              float opacity = exp(-0.5 * A) * vColor.a;
              opacity = mix(whiteNoiseDither(vPosition / ditherGranularity, opacity), opacity, noisiness);
              `
            );

            // vertex shader patch
            shader.vertexShader =
              `
              uniform float time;
              uniform vec3 noiseScale;
              uniform float noiseSpeed;
              uniform vec3 noiseRate;
              uniform float noiseSharpness;
              uniform float gridScale;
              uniform float gridAmount;

              vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+10.0)*x);
}

float permute(float x) {
     return mod289(((x*34.0)+10.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
  {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p,s;

  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

  return p;
  }
						
// (sqrt(5) - 1)/4 = F4, used once below
#define F4 0.309016994374947451

float snoise(vec4 v)
  {
  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
                        0.276393202250021,  // 2 * G4
                        0.414589803375032,  // 3 * G4
                       -0.447213595499958); // -1 + 4 * G4

// First corner
  vec4 i  = floor(v + dot(v, vec4(F4)) );
  vec4 x0 = v -   i + dot(i, C.xxxx);

// Other corners

// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)
  vec4 i0;
  vec3 isX = step( x0.yzw, x0.xxx );
  vec3 isYZ = step( x0.zww, x0.yyz );
//  i0.x = dot( isX, vec3( 1.0 ) );
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  // i0 now contains the unique values 0,1,2,3 in each channel
  vec4 i3 = clamp( i0, 0.0, 1.0 );
  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

  //  x0 = x0 - 0.0 + 0.0 * C.xxxx
  //  x1 = x0 - i1  + 1.0 * C.xxxx
  //  x2 = x0 - i2  + 2.0 * C.xxxx
  //  x3 = x0 - i3  + 3.0 * C.xxxx
  //  x4 = x0 - 1.0 + 4.0 * C.xxxx
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

// Permutations
  i = mod289(i); 
  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute( permute( permute( permute (
             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope
// 7*7*6 = 294, which is close to the ring size 17*17 = 289.
  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

  vec4 p0 = grad4(j0,   ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

// Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4,p4));

// Mix contributions from the five corners
  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;

  }
              ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
              "vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));",
              `
              vec3 splatCenter = uintBitsToFloat(uvec3(sampledCenterColor.gba));
              vec3 noiseCoords = splatCenter * noiseRate;
              
              float noiseX = snoise(vec4(noiseCoords, time * noiseSpeed));
              float noiseY = snoise(vec4(noiseCoords + vec3(123.4, 567.8, 901.2), time * noiseSpeed));
              float noiseZ = snoise(vec4(noiseCoords + vec3(234.5, 678.9, 12.3), time * noiseSpeed));

              vec3 noise = vec3(noiseX, noiseY, noiseZ);
              
              // Apply sharpness
              noise = pow(abs(noise), vec3(noiseSharpness)) * sign(noise);

              // Apply grid snapping
              vec3 gridNoise = round(noise / gridScale) * gridScale;
              noise = mix(noise, gridNoise, gridAmount);

              splatCenter += noise * noiseScale;
              `
            );
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
      .then(injectDither)
      .catch((err: unknown) => {
        console.log("Error loading splat scenes:", err);
      });

    setViewer(viewer);

    return () => void viewer.dispose();
  }, [sources]);

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
  ]);

  return <primitive object={viewer} />;
}
