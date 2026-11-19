import { Skia } from '@shopify/react-native-skia';

/**
 * Single-pass GPU pipeline. Coordinates (`xy`) are output pixels, the `image`
 * child already carries the geometry matrix (orient, straighten, crop).
 *
 * Order: sharpen -> exposure / white balance (linear light) -> film simulation
 * -> tone (contrast, brightness, highlights, shadows, whites, blacks, clarity)
 * -> user curves -> saturation / vibrance -> fade -> vignette -> grain.
 *
 * `lut` is a 256x2 texture: row 0 = film tone curve, row 1 = user curve.
 */
const PHOTO_SKSL = `
uniform shader image;
uniform shader lut;

uniform float2 outSize;
uniform float bypass;
uniform float exposure;
uniform float brightness;
uniform float contrast;
uniform float highlights;
uniform float shadows;
uniform float whites;
uniform float blacks;
uniform float temperature;
uniform float tint;
uniform float saturation;
uniform float vibrance;
uniform float sharpen;
uniform float clarity;
uniform float needLocal;
uniform float detailScale;
uniform float fade;
uniform float vignette;
uniform float grain;
uniform float grainSize;
uniform float3 filmR;
uniform float3 filmG;
uniform float3 filmB;
uniform float3 shadowTint;
uniform float3 highlightTint;
uniform float filmSat;
uniform float filmStrength;
uniform float userCurve;

const float3 LUMA = float3(0.2126, 0.7152, 0.0722);

float luma(float3 c) { return dot(c, LUMA); }

float3 sampleRGB(float2 p) { return image.eval(p).rgb; }

float3 toLinear(float3 c) { return pow(max(c, 0.0), float3(2.2)); }
float3 toGamma(float3 c) { return pow(max(c, 0.0), float3(0.4545454)); }

float3 lutLookup(float3 c, float row) {
  float3 i = clamp(c, 0.0, 1.0) * 255.0 + 0.5;
  return float3(
    lut.eval(float2(i.r, row)).r,
    lut.eval(float2(i.g, row)).g,
    lut.eval(float2(i.b, row)).b
  );
}

float hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + float2(1.0, 0.0));
  float c = hash(i + float2(0.0, 1.0));
  float d = hash(i + float2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

half4 main(float2 xy) {
  float4 src = image.eval(xy);
  if (bypass > 0.5) {
    return half4(src);
  }
  float3 c = src.rgb;

  // Luminance unsharp mask (cross kernel) – avoids color fringing.
  if (sharpen > 0.0) {
    float r = detailScale;
    float3 blur = (sampleRGB(xy + float2(r, 0.0)) + sampleRGB(xy - float2(r, 0.0)) +
                   sampleRGB(xy + float2(0.0, r)) + sampleRGB(xy - float2(0.0, r))) * 0.25;
    c += float3(luma(c - blur) * sharpen * 2.5);
  }

  // Local mean luminance drives clarity and the highlight/shadow masks.
  float localMean = luma(c);
  if (needLocal > 0.5) {
    float radius = 0.012 * max(outSize.x, outSize.y);
    float acc = 0.0;
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982;
      float2 o = float2(cos(a), sin(a)) * radius;
      acc += luma(sampleRGB(xy + o)) + luma(sampleRGB(xy + o * 0.45));
    }
    localMean = acc / 16.0;
  }

  // Exposure and white balance in linear light.
  float3 lin = toLinear(c) * exp2(exposure);
  float3 wb = float3(1.0 + temperature * 0.3, 1.0 - tint * 0.25, 1.0 - temperature * 0.3);
  lin *= wb / luma(wb);
  c = toGamma(lin);

  // Film simulation.
  if (filmStrength > 0.0) {
    float3 f = float3(dot(filmR, c), dot(filmG, c), dot(filmB, c));
    f = lutLookup(f, 0.5);
    f = mix(float3(luma(f)), f, filmSat);
    float fl = luma(f);
    f += shadowTint * (1.0 - smoothstep(0.0, 0.5, fl)) + highlightTint * smoothstep(0.5, 1.0, fl);
    c = mix(c, f, filmStrength);
  }

  // Contrast: S-curve when positive, compress towards mid grey when negative.
  c = clamp(c, 0.0, 1.0);
  if (contrast >= 0.0) {
    c = mix(c, c * c * (3.0 - 2.0 * c), contrast);
  } else {
    c = 0.5 + (c - 0.5) * (1.0 + contrast * 0.6);
  }

  // Brightness: midtone gamma, endpoints stay fixed.
  c = pow(max(c, 0.0), float3(exp2(-brightness * 0.8)));

  float lum = luma(c);
  float maskL = mix(lum, localMean, 0.35);
  float tone = highlights * 0.3 * smoothstep(0.4, 1.0, maskL);
  tone += shadows * 0.3 * (1.0 - smoothstep(0.0, 0.6, maskL));
  tone += whites * 0.25 * smoothstep(0.5, 1.0, lum);
  tone += blacks * 0.2 * (1.0 - smoothstep(0.0, 0.5, lum));
  c += float3(tone);

  if (clarity != 0.0) {
    float mid = 1.0 - pow(abs(lum * 2.0 - 1.0), 2.0);
    c += float3((lum - localMean) * clarity * 0.8 * mid);
  }

  if (userCurve > 0.5) {
    c = lutLookup(c, 1.5);
  }

  // Saturation and vibrance (vibrance protects already saturated colors).
  float l2 = luma(c);
  float chroma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  float vib = 1.0 + vibrance * (1.0 - smoothstep(0.0, 0.6, chroma));
  c = mix(float3(l2), c, max((1.0 + saturation) * vib, 0.0));

  // Fade: matte blacks, slightly softened whites.
  c = fade * 0.12 + c * (1.0 - fade * 0.18);

  // Vignette, elliptical over the output frame.
  if (vignette != 0.0) {
    float2 uv = xy / outSize - 0.5;
    float d = length(uv) * 1.41421356;
    float v = smoothstep(0.3, 1.05, d);
    if (vignette < 0.0) {
      c *= 1.0 + vignette * v * 0.9;
    } else {
      c = mix(c, float3(1.0), vignette * v * 0.7);
    }
  }

  // Film grain: value noise, strongest in the midtones.
  if (grain > 0.0) {
    float cell = grainSize * detailScale;
    float n = valueNoise(xy / cell) * 0.65 + valueNoise(xy / (cell * 0.5) + 17.0) * 0.35;
    float w = 1.0 - abs(luma(c) - 0.5) * 1.2;
    c += float3((n - 0.5) * grain * 0.16 * w);
  }

  return half4(half3(clamp(c, 0.0, 1.0)), 1.0);
}
`;

const effect = Skia.RuntimeEffect.Make(PHOTO_SKSL);

if (!effect) {
  throw new Error('Photo shader failed to compile');
}

export const photoEffect = effect;
