import { NativeModule, requireOptionalNativeModule } from 'expo';

declare class PhotoExifModule extends NativeModule {
  copyExif(
    sourceUri: string,
    targetUri: string,
    fallbacks: Record<string, string>,
    overrides: Record<string, string>,
  ): Promise<void>;
}

/** Null on platforms / builds without the native module (iOS, web, Expo Go). */
export default requireOptionalNativeModule<PhotoExifModule>('PhotoExif');
