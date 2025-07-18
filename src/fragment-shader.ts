export const fragmentShader = `
  precision highp float;
            #include <common>
 
            uniform vec3 debugColor;

            varying vec4 vColor;
            varying vec2 vUv;
            varying vec2 vPosition;

            uniform float noisiness;
            uniform float ditherGranularity;
            uniform float fogStart;
            uniform float fogEnd;
            uniform float fogAmount;
            varying float vDist;

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
        
            void main () {
                // Compute the positional squared distance from the center of the splat to the current fragment.
                float A = dot(vPosition, vPosition);
                // Since the positional data in vPosition has been scaled by sqrt(8), the squared result will be
                // scaled by a factor of 8. If the squared result is larger than 8, it means it is outside the ellipse
                // defined by the rectangle formed by vPosition. It also means it's farther
                // away than sqrt(8) standard deviations from the mean.
                if (A > 8.0) discard;
                vec3 color = vColor.rgb;

                // Since the rendered splat is scaled by sqrt(8), the inverse covariance matrix that is part of
                // the gaussian formula becomes the identity matrix. We're then left with (X - mean) * (X - mean),
                // and since 'mean' is zero, we have X * X, which is the same as A:
                float opacity = exp(-0.5 * A) * vColor.a;
                opacity = mix(whiteNoiseDither(vPosition / ditherGranularity, opacity), opacity, noisiness);

                float fogFactor = smoothstep(fogStart, fogEnd, vDist);
                opacity *= (1.0 - fogFactor * fogAmount);

                gl_FragColor = vec4(color.rgb, opacity);
            }
                `;
