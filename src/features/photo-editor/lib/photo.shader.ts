import { Skia } from '@shopify/react-native-skia';

/**
 * Single-pass GPU pipeline. Coordinates (`xy`) are output pixels, the `image`
 * child already carries the geometry matrix (orient, straighten, crop).
 *
 * Order: sharpen -> exposure / white balance (linear light) -> film simulation
 * -> tone (contrast, brightness, highlights, shadows, whites, blacks, clarity)
 * -> user curves -> saturation / vibrance -> fade -> lens look -> light filter
 * -> vignette -> grain. Lens distortion remaps the sampling position first.
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
uniform float lensMode;
uniform float lensAmount;
uniform float filterMode;
uniform float filterAmount;

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


bool isLens(float mode) { return abs(lensMode - mode) < 0.5; }
bool isFilter(float mode) { return abs(filterMode - mode) < 0.5; }

float maxDim() { return max(outSize.x, outSize.y); }

// Equidistant-style fisheye: output radius (0..1) -> source radius (0..1).
float fisheyeRadius(float r, float theta) { return tan(r * theta) / tan(theta); }

// Source position for an output pixel (barrel distortion of the fisheye lenses).
float2 lensWarp(float2 xy) {
  float2 c = outSize * 0.5;
  float2 d = xy - c;
  float len = length(d);
  if (len < 0.001) return xy;
  float corner = length(c);
  if (isLens(1.0)) {
    return c + d / len * fisheyeRadius(len / corner, 0.05 + 1.3 * lensAmount) * corner;
  }
  if (isLens(2.0)) {
    // The whole frame squeezed into a circle inscribed in the output.
    float r = min(len / min(c.x, c.y), 1.0);
    return c + d / len * fisheyeRadius(r, 0.6 + 0.8 * lensAmount) * corner;
  }
  if (isLens(6.0)) {
    return c + d / len * fisheyeRadius(len / corner, 0.05 + 0.5 * lensAmount) * corner;
  }
  return xy;
}

// Jittered golden-spiral disc average of the part of the image above the threshold
// (0 = plain blur). Jitter trades banding for fine noise, which reads as grain.
float3 discBlur(float2 p, float radius, float threshold, float gain) {
  float3 acc = float3(0.0);
  float spin = hash(p) * 6.2831853;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float a = fi * 2.3999632 + spin;
    float2 o = float2(cos(a), sin(a)) * sqrt((fi + 0.5) / 16.0) * radius;
    acc += max(image.eval(p + o).rgb * gain - threshold, 0.0);
  }
  return acc / (16.0 * (1.0 - threshold));
}

// Radial blur towards the frame center.
float3 zoomBlur(float2 p) {
  float2 c = outSize * 0.5;
  float strength = 0.13 * lensAmount;
  float jitter = hash(p);
  float3 acc = float3(0.0);
  for (int i = 0; i < 12; i++) {
    float t = (float(i) + jitter) / 12.0;
    acc += image.eval(c + (p - c) * (1.0 - t * strength)).rgb;
  }
  return acc / 12.0;
}

// Base color at a (warped) position, with the blur / chromatic aberration of the lens.
float3 lensSample(float2 p) {
  float2 d = p - outSize * 0.5;
  float3 c = image.eval(p).rgb;
  if (isLens(3.0)) {
    // Tilt-shift: sharp horizontal band, increasingly blurred above and below.
    float m = smoothstep(0.06, 0.42, abs(p.y / outSize.y - 0.5));
    float radius = m * lensAmount * 0.016 * maxDim();
    if (radius > 0.75) c = discBlur(p, radius, 0.0, 1.0);
  } else if (isLens(4.0)) {
    c = zoomBlur(p);
  } else if (isLens(5.0)) {
    // Old glass: soft corners.
    float m = smoothstep(0.4, 1.0, length(d) / length(outSize * 0.5));
    float radius = m * lensAmount * 0.008 * maxDim();
    if (radius > 0.75) c = discBlur(p, radius, 0.0, 1.0);
  }
  float ca = isLens(5.0) ? 0.012 : isLens(6.0) ? 0.008 : isLens(7.0) ? 0.004 : 0.0;
  if (ca > 0.0) {
    c.r = image.eval(p + d * ca * lensAmount).r;
    c.b = image.eval(p - d * ca * lensAmount).b;
  }
  return c;
}

// Anamorphic flare: bright sources smeared into long horizontal blue streaks.
float3 anamorphicStreak(float2 p, float gain) {
  float halfLength = outSize.x * (0.06 + 0.12 * lensAmount);
  float jitter = hash(p) - 0.5;
  float acc = 0.0;
  for (int i = 0; i < 24; i++) {
    float t = (float(i) + 0.5 + jitter) / 12.0 - 1.0;
    float l = luma(image.eval(p + float2(t * halfLength, 0.0)).rgb * gain);
    acc += max(l - 0.75, 0.0) * (1.0 - abs(t));
  }
  return float3(0.35, 0.6, 1.0) * acc / 24.0 * 12.0 * lensAmount;
}

float3 rainbow(float t) {
  return 0.5 + 0.5 * cos(6.2831853 * (t + float3(0.0, 0.33, 0.67)));
}

float3 screen(float3 a, float3 b) { return 1.0 - (1.0 - a) * (1.0 - clamp(b, 0.0, 1.0)); }

// Color character of the lens, applied after the film grade.
float3 lensLook(float3 c, float2 xy) {
  float2 uv = xy / outSize;
  float edge = length(uv - 0.5) * 1.41421356;
  float a = lensAmount;
  if (isLens(3.0)) {
    c = mix(float3(luma(c)), c, 1.0 + 0.35 * a);
  } else if (isLens(5.0)) {
    c = mix(c, c * float3(1.04, 1.0, 0.9) * 0.92 + 0.05, a * 0.6);
    c *= 1.0 - 0.35 * a * smoothstep(0.4, 1.1, edge);
  } else if (isLens(6.0)) {
    c = mix(float3(luma(c)), c, 1.0 + 0.3 * a);
    c = mix(c, c * c * (3.0 - 2.0 * c), 0.4 * a);
    c *= 1.0 - 0.8 * a * smoothstep(0.25, 1.0, edge);
  }
  return c;
}

// Light filters in front of the lens; p is the (warped) source position.
float3 lightFilter(float3 c, float2 xy, float2 p, float gain) {
  float a = filterAmount;
  float2 uv = xy / outSize;
  if (isFilter(1.0)) {
    // Pro-Mist: highlights bloom, blacks lift.
    float3 bloom = discBlur(p, 0.02 * maxDim(), 0.5, gain);
    c = mix(c, c * 0.9 + 0.06, a * 0.5) + bloom * a * 0.9;
  } else if (isFilter(2.0)) {
    // Halation: red-orange glow around bright edges (CineStill look).
    float3 bloom = discBlur(p, 0.008 * maxDim(), 0.6, gain);
    c += luma(bloom) * float3(1.0, 0.3, 0.12) * a * 2.4;
  } else if (isFilter(3.0)) {
    // Prism: a shifted, rainbow-tinted ghost of the scene on one side.
    float shift = 0.03 * maxDim() * (0.3 + a);
    float ghost = luma(image.eval(p + float2(shift, shift * 0.3)).rgb * gain);
    float w = 1.0 - smoothstep(0.05, 0.75, uv.x);
    c = screen(c, rainbow(uv.y * 0.8 + uv.x * 0.3) * ghost * w * a * 1.3);
  } else if (isFilter(4.0)) {
    // Light leak: warm glows bleeding in from the frame edges.
    float g1 = exp(-pow(length((uv - float2(-0.1, 0.3)) * float2(1.6, 0.9)), 2.0) * 3.0);
    float g2 = exp(-pow(length((uv - float2(1.05, 0.85)) * float2(1.8, 1.0)), 2.0) * 5.0);
    c = screen(c, (float3(1.0, 0.38, 0.12) * g1 + float3(1.0, 0.25, 0.45) * g2 * 0.6) * a);
  }
  return c;
}

half4 main(float2 xy) {
  if (bypass > 0.5) {
    return half4(image.eval(xy));
  }
  float2 p = lensWarp(xy);
  float3 c = lensSample(p);

  // Luminance unsharp mask (cross kernel) – avoids color fringing.
  if (sharpen > 0.0) {
    float r = detailScale;
    float3 blur = (sampleRGB(p + float2(r, 0.0)) + sampleRGB(p - float2(r, 0.0)) +
                   sampleRGB(p + float2(0.0, r)) + sampleRGB(p - float2(0.0, r))) * 0.25;
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
      acc += luma(sampleRGB(p + o)) + luma(sampleRGB(p + o * 0.45));
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

  // Lens character and light filters (no-ops when both modes are 0).
  float gain = exp2(exposure);
  if (lensMode > 0.5) {
    c = lensLook(clamp(c, 0.0, 1.0), xy);
    if (isLens(7.0)) c += anamorphicStreak(p, gain);
  }
  if (filterMode > 0.5) {
    c = lightFilter(clamp(c, 0.0, 1.0), xy, p, gain);
  }

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

  // Circular fisheye: black outside the image circle (1px anti-aliased edge).
  if (isLens(2.0)) {
    float2 h = outSize * 0.5;
    c *= clamp(min(h.x, h.y) - length(xy - h), 0.0, 1.0);
  }

  return half4(half3(clamp(c, 0.0, 1.0)), 1.0);
}
`;

const effect = Skia.RuntimeEffect.Make(PHOTO_SKSL);

if (!effect) {
  throw new Error('Photo shader failed to compile');
}

export const photoEffect = effect;
