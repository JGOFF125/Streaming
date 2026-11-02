import React, { useState } from 'react';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeSyntheticEvent, ViewProps } from 'react-native';

type BrowserStatus = { code: string; canGoBack: boolean; mediaPermissionPending: boolean };
type BrowserProps = ViewProps & {
  active: boolean;
  command: string;
  onStatus: (event: NativeSyntheticEvent<BrowserStatus>) => void;
};
type BrowserModule = { experimentVersion: number; clearBrowserData(): Promise<void> };
const providerModule = Platform.OS === 'android'
  ? requireOptionalNativeModule<BrowserModule>('OrbitProvider') : null;
const Browser = providerModule?.experimentVersion === 1 ? requireNativeView<BrowserProps>('OrbitProvider') : null;

const messages: Record<string, string> = {
  loading: 'Loading Netflix’s official website…',
  page_loaded: 'Netflix page loaded. Movie playback has not been verified.',
  network_error: 'The page could not load. Check the connection, then retry.',
  http_error: 'Netflix returned a page error. Read its message in the player area.',
  navigation_blocked: 'A link outside the allowed Netflix website was blocked.',
  certificate_error: 'A secure connection could not be verified. The request was stopped.',
  authentication_blocked: 'This authentication method is not supported by this test.',
  renderer_stopped: 'The browser stopped. Close the test, then open it again.',
  browser_unavailable: 'The Android browser could not start. Close the test and check Android System WebView.',
  protected_media_required: 'Netflix requested permission for protected playback.',
  protected_media_allowed: 'Protected playback allowed for this page. This does not prove a movie plays.',
  protected_media_denied: 'Protected playback permission declined.',
  protected_media_cancelled: 'The protected playback request ended.',
  permission_blocked: 'A website permission outside this test’s scope was blocked.',
  popup_blocked: 'A new window was blocked. Continue using the page inside Orbit.',
  download_blocked: 'Downloads are disabled in this test.',
  file_upload_blocked: 'File uploads are disabled in this test.',
  fullscreen_unavailable: 'Fullscreen is not enabled in this first test. Try playback inside the panel.',
  background_closed: 'The test stopped when Orbit left the foreground. Reopen it to continue.',
};
type Observation = 'not_tested' | 'movie_played' | 'sign_in_only' | 'provider_blocked';

export default function NetflixInsidePanel() {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [command, setCommand] = useState('0:reload');
  const [status, setStatus] = useState<BrowserStatus>({ code: '', canGoBack: false, mediaPermissionPending: false });
  const [observation, setObservation] = useState<Observation>('not_tested');
  const [notice, setNotice] = useState('');

  function act(name: 'back' | 'reload' | 'allow_media' | 'deny_media') {
    setCommand(previous => (Number(previous.split(':')[0]) + 1) + ':' + name);
  }
  function start() {
    setNotice(''); setObservation('not_tested');
    setStatus({ code: 'loading', canGoBack: false, mediaPermissionPending: false });
    setOpen(true);
  }
  function close() {
    setOpen(false);
    setStatus(previous => ({ ...previous, canGoBack: false, mediaPermissionPending: false }));
  }
  async function clear() {
    if (!providerModule || clearing) return;
    close(); setClearing(true); setNotice('');
    try {
      await providerModule.clearBrowserData();
      setNotice('Netflix browser cookies and site storage in Orbit were cleared. Netflix’s own app is unaffected.');
    } catch {
      setNotice('Browser cleanup could not finish. Please try again.');
    } finally { setClearing(false); }
  }

  return <View style={s.panel}>
    <Text style={s.title}>Netflix inside Orbit</Text>
    <Text style={s.note}>Playback experiment · automatic sync is not connected.</Text>
    <Text style={s.note}>This opens Netflix’s official website inside Orbit. It may require its own sign-in and may not support this browser. A loaded page or successful sign-in does not count as movie playback.</Text>
    <Text style={s.note}>No notification or microphone access is needed. Orbit code does not read passwords, cookies or page content. Netflix may remember your sign-in in this browser until you clear it below.</Text>
    {!Browser ? <Text style={s.note}>Install Orbit 1.3.0 or newer to use this Android test. Older builds and Expo Go do not contain this player surface.</Text> : <>
      {!open && <Button label="Test Netflix inside Orbit" disabled={clearing} onPress={start} />}
      {open && <>
        <Text style={s.address}>Official website · netflix.com</Text>
        <Text style={s.note}>Stay in Orbit during this test. Switching apps closes the player; Netflix browser sign-in may be remembered.</Text>
      </>}
      {/* Remains mounted at zero height when closed so cleanup controls work without loading a page. */}
      <Browser style={{ height: open ? 540 : 0, marginTop: open ? 12 : 0 }} active={open} command={command}
        onStatus={({ nativeEvent }) => {
          setStatus(nativeEvent);
          if (nativeEvent.code === 'background_closed' || nativeEvent.code === 'renderer_stopped' ||
            nativeEvent.code === 'browser_unavailable') setOpen(false);
        }} />
      {!!status.code && <Text accessibilityLiveRegion="polite" style={s.note}>{messages[status.code] ?? 'The browser state changed.'}</Text>}
      {open && <>
        <View style={s.row}>
          <Button label="Back in Netflix" disabled={!status.canGoBack || clearing} onPress={() => act('back')} />
          <Button label="Reload" disabled={clearing} onPress={() => act('reload')} />
          <Button label="Close player" disabled={clearing} onPress={close} />
        </View>
        {status.mediaPermissionPending && <View style={s.consent}>
          <Text style={s.note}>Protected playback may let Netflix use a device identifier for content protection. Allow it only for this Netflix page? Camera, microphone and location remain blocked.</Text>
          <Button label="Allow protected playback" disabled={clearing} onPress={() => act('allow_media')} />
          <Button label="Decline" disabled={clearing} onPress={() => act('deny_media')} />
        </View>}
      </>}
      <Button label={clearing ? 'Clearing browser…' : 'Clear Netflix browser sign-in'} disabled={clearing} onPress={() => { void clear(); }} />
      <Text style={s.label}>What happened inside Orbit?</Text>
      <Text style={s.note}>Choose “Movie played” only if a full movie or episode actually showed video and sound inside this panel, rather than opening Netflix’s separate app.</Text>
      <View style={s.row}>
        {([['movie_played', 'Movie played'], ['sign_in_only', 'Sign-in / page only'], ['provider_blocked', 'Netflix blocked playback']] as const)
          .map(([value, label]) => <Button key={value} label={label} selected={observation === value}
            disabled={clearing} onPress={() => setObservation(value)} />)}
      </View>
      {observation !== 'not_tested' && <Text selectable style={s.report}>{JSON.stringify({
        diagnostic: 'Orbit in-app Netflix v1',
        playback: observation,
        evidence: 'user_reported',
        browserEvent: status.code || 'none',
        titleIdentityVerified: false,
        automaticSyncVerified: false,
      }, null, 2)}</Text>}
      {!!notice && <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text>}
    </>}
  </View>;
}

function Button({ label, disabled, selected, onPress }: { label: string; disabled: boolean; selected?: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled, selected }} disabled={disabled}
    style={[s.button, selected && s.selected, disabled && s.disabled]} onPress={onPress}>
    <Text style={s.buttonText}>{label}</Text>
  </TouchableOpacity>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#172138', borderRadius: 18, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: '#2b3552' },
  title: { color: '#fff', fontWeight: '700', fontSize: 19 },
  note: { color: '#becae0', fontSize: 13, lineHeight: 19, marginTop: 9 },
  address: { color: '#fff', backgroundColor: '#0b1020', padding: 12, marginTop: 14, borderRadius: 8, fontWeight: '600' },
  label: { color: '#fff', fontWeight: '700', marginTop: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { backgroundColor: '#33415f', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  selected: { backgroundColor: '#505ce0' },
  disabled: { opacity: 0.5 },
  consent: { padding: 12, borderWidth: 1, borderColor: '#a5b4fc', borderRadius: 10, marginTop: 12 },
  report: { color: '#d6deee', fontSize: 12, padding: 12, backgroundColor: '#0b1020', marginTop: 12, borderRadius: 8 },
});
