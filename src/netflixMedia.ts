import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import type { MediaCommand, NetflixSnapshot, NetflixTestResult } from './netflixDiagnostics';

type NetflixMediaBridge = {
  getSnapshot(): Promise<NetflixSnapshot>;
  openAccessSettings(): Promise<void>;
  openNetflix(): Promise<void>;
  runTest(command: MediaCommand): Promise<NetflixTestResult>;
  cancelTest(): Promise<void>;
};

// Existing development builds and Expo Go must still open without this module.
export const netflixMedia = Platform.OS === 'android'
  ? requireOptionalNativeModule<NetflixMediaBridge>('OrbitMedia') : null;
