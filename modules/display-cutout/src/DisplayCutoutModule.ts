import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { CutoutRect } from './DisplayCutout.types';

declare class DisplayCutoutModule extends NativeModule {
  getCutouts(): CutoutRect[];
}

/** Null on platforms / builds without the native module (iOS, web, Expo Go). */
export default requireOptionalNativeModule<DisplayCutoutModule>('DisplayCutout');
