import React, { useState } from 'react';
import { router } from 'expo-router';
import { Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { embeddedNetflixReport, initialBrowserHistory, readBrowserStatus, recordBrowserEvent } from '../embeddedNetflixDiagnostics';
import { netflixContentId } from '../playbackClient';
import type { BrowserStatus, Observation, NetflixEntryPoint, BrowserProfile } from '../embeddedNetflixDiagnostics';
import { NetflixProviderView as Browser, providerModule, directPageCommandsReady, desktopProfileReady } from './NetflixProviderView';

const messages: Record<string, string> = {
  loading: 'Loading Netflix…',
  page_loaded: 'Page loaded · movie playback unverified',
  network_error: 'Could not load the page. Check your connection.',
  http_error: 'Netflix returned a page error.',
  navigation_blocked: 'A link outside the Netflix website was blocked.',
  certificate_error: 'A secure connection could not be verified.',
  authentication_blocked: 'This sign-in method is not supported by this test.',
  renderer_stopped: 'The browser stopped. Reopen the website to try again.',
  browser_unavailable: 'Android’s browser could not start.',
  protected_media_required: 'Netflix requested protected playback.',
  protected_media_allowed: 'Protected playback allowed · movie playback unverified',
  protected_media_denied: 'Protected playback declined.',
  protected_media_cancelled: 'The protected playback request ended.',
  permission_blocked: 'An unsupported website permission was blocked.',
  popup_blocked: 'A new window was blocked.',
  download_blocked: 'Downloads are disabled.',
  file_upload_blocked: 'File uploads are disabled.',
  fullscreen_unavailable: 'Use the page inside this screen; website fullscreen is unavailable.',
  background_closed: 'Orbit left the foreground. Reopen the website to continue.',
  desktop_profile_applied: 'Desktop compatibility settings applied · playback unverified',
  browser_profile_unavailable: 'This WebView could not apply the desktop profile. The standard profile remains available.',
};

export default function NetflixPlayerScreen() {
  const [open, setOpen] = useState(false);
  const [browserProfile, setBrowserProfile] = useState<BrowserProfile>('system');
  const [clearing, setClearing] = useState(false);
  const [command, setCommand] = useState('');
  const [status, setStatus] = useState<BrowserStatus | null>(null);
  const [observation, setObservation] = useState<Observation>('not_tested');
  const [history, setHistory] = useState(initialBrowserHistory);
  const [report, setReport] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [details, setDetails] = useState(false);
  const [notice, setNotice] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [entryPoint, setEntryPoint] = useState<NetflixEntryPoint>('login');

  function act(name: string) {
    setCommand(previous => (Number(previous.split(':')[0]) + 1) + ':' + name);
  }
  function start(profile:BrowserProfile) {
    if(profile==='desktop' && !desktopProfileReady)return;
    setBrowserProfile(profile);
    setHistory(initialBrowserHistory()); setReport(null); setObservation('not_tested');
    setAttempted(true); setNotice(''); setCommand(''); setDetails(false); setEntryPoint('login');
    setStatus({ code: 'loading', canGoBack: false, mediaPermissionPending: false });
    setOpen(true);
  }
  function openOfficialPage(watch: boolean) {
    if (!open || !directPageCommandsReady || clearing) return;
    const id = watch ? netflixContentId(titleInput) : null;
    if (watch && !id) { setNotice('Use a public Netflix title/watch link or a numeric catalog ID.'); return; }
    Keyboard.dismiss();
    setNotice(''); setReport(null); setObservation('not_tested');
    setEntryPoint(watch ? 'watch_link' : 'browse');
    setTitleInput(''); setDetails(false);
    act(watch ? 'watch_' + id : 'browse');
  }
  function close() {
    setOpen(false);
    setStatus(previous => previous ? { ...previous, canGoBack: false, mediaPermissionPending: false } : null);
  }
  function back() {
    close();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  async function clear() {
    if (!providerModule || clearing) return;
    close(); setClearing(true); setNotice('');
    try {
      await providerModule.clearBrowserData();
      setNotice('Netflix browser sign-in and site storage in Orbit were cleared. Netflix’s app is unaffected.');
    } catch { setNotice('Browser cleanup could not finish. Please try again.'); }
    finally { setClearing(false); }
  }

  return <SafeAreaView style={s.page} edges={['top', 'bottom', 'left', 'right']}>
    <View style={s.main} aria-hidden={details} pointerEvents={details ? 'none' : 'auto'} accessibilityElementsHidden={details}
      importantForAccessibility={details ? 'no-hide-descendants' : 'auto'}>
    <View style={s.header}>
      <Button label="Back" onPress={back} disabled={clearing} />
      <View style={s.heading}>
        <Text style={s.title}>Netflix</Text>
        <Text style={s.subtitle}>{browserProfile==='desktop'?'Desktop compatibility test · sync unavailable':'Standard browser test · sync unavailable'}</Text>
      </View>
      <Button label="Details" onPress={() => setDetails(true)} disabled={clearing} />
    </View>
    <Text style={s.address}>Official website · netflix.com</Text>
    {open && <View style={s.toolbar}>
      <Button label="Back in page" disabled={!status?.canGoBack || clearing} onPress={() => act('back')} />
      <Button label="Reload" disabled={clearing} onPress={() => act('reload')} />
      <Button label="Close website" disabled={clearing} onPress={close} />
    </View>}
    {open && status?.mediaPermissionPending && <View style={s.consent}>
      <Text style={s.note}>Netflix requested protected playback. Allowing it may share a device identifier for content licensing.</Text>
      <View style={s.toolbar}>
        <Button label="Allow protected playback" disabled={clearing} onPress={() => act('allow_media')} />
        <Button label="Decline" disabled={clearing} onPress={() => act('deny_media')} />
      </View>
    </View>}
    <View testID="netflix-browser-frame" style={s.stage}
      pointerEvents={details ? 'none' : 'auto'} accessibilityElementsHidden={details}
      importantForAccessibility={details ? 'no-hide-descendants' : 'auto'}>
      {open && Browser ? <Browser style={s.browser} active {...(desktopProfileReady?{profile:browserProfile}:{})} command={command} onStatus={({ nativeEvent }) => {
        const next = readBrowserStatus(nativeEvent);
        if (!next) return;
        setStatus(next);
        setHistory(previous => recordBrowserEvent(previous, next));
        if (next.code === 'background_closed' || next.code === 'renderer_stopped' ||
          next.code === 'browser_unavailable' || next.code === 'browser_profile_unavailable') setOpen(false);
      }} /> : <ScrollView contentContainerStyle={s.empty}>
        <Text style={s.badge}>PLAYBACK NOT AVAILABLE YET</Text>
        <Text style={s.emptyTitle}>Test Netflix inside Orbit</Text>
        <Text style={s.emptyText}>The standard website signed in on the tested phone, then asked for its app to watch. The optional desktop profile is a separate compatibility experiment; actual movie playback remains unverified.</Text>
        {Browser ? <>
          <Button label="Open standard website" disabled={clearing} onPress={()=>start('system')} />
          <Button label="Try desktop compatibility profile" disabled={clearing || !desktopProfileReady} onPress={()=>start('desktop')} primary />
          <Text style={s.emptyText}>The optional profile adjusts the browser identifier and supported Client Hints together. The engine, phone and content protection remain Android. Netflix may still block playback. It does not need notification access.</Text>
        </>
          : <Text style={s.emptyText}>{Platform.OS === 'android'
            ? 'Install the updated standalone Orbit APK to use the native browser.'
            : 'This browser test needs the Android Orbit app. This preview shows the screen layout only.'}</Text>}
        <Button label="Test details and results" disabled={clearing} onPress={() => setDetails(true)} />
      </ScrollView>}
    </View>
    <View style={s.footer}>
      <Text accessibilityLiveRegion="polite" numberOfLines={2} style={s.status}>
        {status ? messages[status.code] : 'No notification or microphone access needed.'}
      </Text>
      {attempted && <Button label="Results" disabled={clearing} onPress={() => setDetails(true)} />}
    </View>
    </View>
    {details && <SafeAreaView style={s.overlay} edges={['top', 'bottom', 'left', 'right']} accessibilityViewIsModal>
      <View style={s.detailsHeader}>
        <Text accessibilityRole="header" style={s.title}>Test details</Text>
        <Button label="Done" disabled={clearing} onPress={() => setDetails(false)} />
      </View>
      <ScrollView contentContainerStyle={s.detailsBody} keyboardShouldPersistTaps="handled">
        <Text style={s.sectionTitle}>Compatibility profile</Text>
        <Text style={s.note}>{browserProfile==='desktop'?'Desktop profile requested':'Standard mobile profile requested'} · native browser experiment {providerModule?.experimentVersion ?? 'unavailable'}.</Text>
        <Text style={s.note}>Use Close website before choosing another profile. The optional test changes supported browser signals, not the Android device, DRM or subscription checks. It injects no scripts and does not read page content or cookies.</Text>
        <Text style={s.sectionTitle}>Current playback limit</Text>
        <Text style={s.note}>The reported Netflix page says its app is required on mobile. The same phone also failed to play in Chrome Desktop site. Sign-in alone is not a successful movie test.</Text>
        <Text style={s.sectionTitle}>Try the official browse or title page</Text>
        <Text style={s.note}>Your screenshot shows Netflix’s mobile app page. After opening its website and signing in, you can try its normal browse page or a public movie link. Netflix may still require its app. A link alone never verifies playback or movie identity.</Text>
        <Button label="Open official browse page" disabled={!open || !directPageCommandsReady || clearing}
          onPress={() => openOfficialPage(false)} />
        <TextInput accessibilityLabel="Public Netflix title link or catalog ID" placeholder="Public Netflix title link or catalog ID"
          placeholderTextColor="#9ca3af" style={s.input} value={titleInput} onChangeText={setTitleInput}
          editable={open && directPageCommandsReady && !clearing} maxLength={2048} autoCapitalize="none" autoCorrect={false} />
        <Button label="Open official title page" disabled={!open || !directPageCommandsReady || clearing || !titleInput.trim()}
          onPress={() => openOfficialPage(true)} />
        {!open && <Text style={s.note}>Open the Netflix website first to enable these controls.</Text>}
        <Text style={s.sectionTitle}>Your sign-in stays with Netflix</Text>
        <Text style={s.note}>Use Netflix’s official page. Orbit code does not read passwords, cookies or page content. Netflix may remember your sign-in in this app’s private browser until you clear it.</Text>
        <Text style={s.note}>Leaving Orbit’s foreground closes this bounded test. Protected playback needs separate consent if Netflix requests it. Camera, microphone and location remain blocked.</Text>
        <Button label={clearing ? 'Clearing browser…' : 'Clear Netflix browser sign-in'} disabled={!providerModule || clearing}
          onPress={() => { void clear(); }} />
        {!!notice && <Text accessibilityLiveRegion="polite" style={s.note}>{notice}</Text>}
        <Text style={s.sectionTitle}>What happened inside Orbit?</Text>
        <Text style={s.note}>Select “Movie played” only for movie or episode video and sound inside Orbit. Opening Netflix’s separate app does not count.</Text>
        {([['movie_played', 'Movie played'], ['sign_in_only', 'Sign-in / page only'],
          ['app_required', 'Netflix asks for its app'], ['provider_blocked', 'Netflix blocked playback']] as const)
          .map(([value, label]) => <Button key={value} label={label} selected={observation === value}
            disabled={!attempted || clearing} onPress={() => {
              setObservation(value); setReport(embeddedNetflixReport(value, history, entryPoint));
            }} />)}
        {!!report && <Text selectable style={s.report}>{report}</Text>}
        <Text style={s.note}>Reports stay in app memory. Background closure is recorded separately from browser events. No automatic synchronization is verified by this test.</Text>
      </ScrollView>
    </SafeAreaView>}
  </SafeAreaView>;
}

function Button({ label, disabled = false, selected, primary, onPress }: {
  label: string; disabled?: boolean; selected?: boolean; primary?: boolean; onPress: () => void;
}) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled, selected }}
    disabled={disabled} onPress={onPress} style={[s.button, (selected || primary) && s.primary, disabled && s.disabled]}>
    <Text style={s.buttonText}>{label}</Text>
  </TouchableOpacity>;
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#0b1020' },
  main: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  heading: { flex: 1, minWidth: 0 },
  title: { color: '#fff', fontSize: 19, fontWeight: '700' },
  subtitle: { color: '#b7c3dd', fontSize: 11, marginTop: 3 },
  address: { color: '#d6deee', fontSize: 12, paddingHorizontal: 16, paddingBottom: 10 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  stage: { flex: 1, backgroundColor: '#080c17', width: '100%' },
  browser: { flex: 1, width: '100%' },
  empty: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'flex-start', gap: 12 },
  badge: { color: '#c6baff', fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  emptyTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  emptyText: { color: '#becae0', fontSize: 14, lineHeight: 21 },
  footer: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12 },
  status: { color: '#bdc9df', fontSize: 12, lineHeight: 17, flex: 1 },
  button: { backgroundColor: '#2d3c58', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 12, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  primary: { backgroundColor: '#505ce0' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  consent: { backgroundColor: '#202b45', paddingTop: 8, borderColor: '#a5b4fc', borderBottomWidth: 1 },
  note: { color: '#becae0', fontSize: 14, lineHeight: 21 },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#0b1020', zIndex: 10 },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  detailsBody: { padding: 20, paddingBottom: 40, gap: 14 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 17, marginTop: 8 },
  input: { backgroundColor: '#172138', borderWidth: 1, borderColor: '#63708c', borderRadius: 10, color: '#fff', padding: 14, minHeight: 52 },
  report: { color: '#d6deee', fontSize: 12, padding: 14, backgroundColor: '#172138', borderRadius: 9 },
});
