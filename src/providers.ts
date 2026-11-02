export type ProviderId = 'youtube' | 'netflix' | 'disney' | 'prime' | 'browser' | 'screen';
export type Provider = { id: ProviderId; label: string; url?: string; status: 'official-player-sync-feasible' | 'research' | 'limited'; detail: string };
export const providers: Provider[] = [
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/', status: 'official-player-sync-feasible', detail: 'YouTube IFrame Player API supports play, pause and seek for embeddable videos. Not implemented yet.' },
  { id: 'netflix', label: 'Netflix', url: 'https://www.netflix.com/', status: 'research', detail: 'Official Netflix app only. Android media-control tests are available above in the new test APK; automatic sync is unconfirmed.' },
  { id: 'disney', label: 'Disney+', url: 'https://www.disneyplus.com/', status: 'research', detail: 'Official external app/site only; playback sync capabilities unconfirmed.' },
  { id: 'prime', label: 'Prime Video', url: 'https://www.primevideo.com/', status: 'research', detail: 'Official external app/site only; playback sync capabilities unconfirmed.' },
  { id: 'browser', label: 'Web browser', url: 'https://example.org/', status: 'limited', detail: 'Safe external-link prototype; shared URL and supported player sync planned, NOT shared login sessions.' },
  { id: 'screen', label: 'Share screen', status: 'limited', detail: 'Requires native Android MediaProjection, active consent and visible sharing indicator; DRM-protected content may be black.' },
];
