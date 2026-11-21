import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { HardwareKeysEvents } from './HardwareKeys.types';

declare class HardwareKeysModule extends NativeModule<HardwareKeysEvents> {
  setEnabled(enabled: boolean): void;
}

/** Null on platforms / builds without the native module (iOS, web, Expo Go). */
export default requireOptionalNativeModule<HardwareKeysModule>('HardwareKeys');
