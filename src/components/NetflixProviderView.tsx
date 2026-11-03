import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';
import type { BrowserStatus } from '../embeddedNetflixDiagnostics';

type BrowserProps = ViewProps & {
  active: boolean;
  command: string;
  onStatus: (event: NativeSyntheticEvent<BrowserStatus>) => void;
};
type BrowserModule = { experimentVersion: number; clearBrowserData(): Promise<void> };
export const providerModule = Platform.OS === 'android'
  ? requireOptionalNativeModule<BrowserModule>('OrbitProvider') : null;
export const NetflixProviderView = providerModule && [1, 2].includes(providerModule.experimentVersion)
  ? requireNativeView<BrowserProps>('OrbitProvider') : null;

export const directPageCommandsReady = (providerModule?.experimentVersion ?? 0) >= 2;
