import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';
import type { BrowserStatus } from '../embeddedNetflixDiagnostics';

type BrowserProps = ViewProps & {
  active: boolean;
  profile?: 'system' | 'desktop';
  command: string;
  onStatus: (event: NativeSyntheticEvent<BrowserStatus>) => void;
};
type BrowserModule = { experimentVersion: number; clearBrowserData(): Promise<void> };
export const providerModule = Platform.OS === 'android'
  ? requireOptionalNativeModule<BrowserModule>('OrbitProvider') : null;
export const NetflixProviderView = providerModule && [1, 2, 3, 4].includes(providerModule.experimentVersion)
  ? requireNativeView<BrowserProps>('OrbitProvider') : null;

export const directPageCommandsReady = (providerModule?.experimentVersion ?? 0) >= 2;

export const desktopProfileReady = (providerModule?.experimentVersion ?? 0) >= 3;

export const nativeErrorCheckReady = (providerModule?.experimentVersion ?? 0) >= 4;
