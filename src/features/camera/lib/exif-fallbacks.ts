import * as Device from 'expo-device';

const pad = (n: number) => String(n).padStart(2, '0');

/** EXIF date format: "YYYY:MM:DD HH:MM:SS" (local time). */
function exifDateTime(date: Date): string {
  return (
    `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/**
 * What the app knows about a capture, used only where the camera HAL did not
 * write the tag itself (it normally writes all of them).
 */
export function captureExifFallbacks(capture: {
  takenAt: Date;
  exposureSeconds: number;
  iso: number;
}): Record<string, string> {
  const tags: Record<string, string | null> = {
    Make: Device.manufacturer,
    Model: Device.modelName,
    DateTimeOriginal: exifDateTime(capture.takenAt),
    ExposureTime: capture.exposureSeconds > 0 ? String(capture.exposureSeconds) : null,
    PhotographicSensitivity: capture.iso > 0 ? String(Math.round(capture.iso)) : null,
  };
  return Object.fromEntries(
    Object.entries(tags).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}
