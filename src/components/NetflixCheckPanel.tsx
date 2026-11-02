import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { netflixMedia } from '../netflixMedia';
import { formatPosition, netflixReport, netflixStatus, netflixTestMessage } from '../netflixDiagnostics';
import type { MediaCommand, NetflixSnapshot, NetflixTestResult } from '../netflixDiagnostics';

export default function NetflixCheckPanel() {
  const [snapshot, setSnapshot] = useState<NetflixSnapshot | null>(null);
  const [result, setResult] = useState<NetflixTestResult | null>(null);
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const running = useRef(false);
  const mounted = useRef(true);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (!netflixMedia || refreshing.current) return;
    refreshing.current = true;
    try {
      const next = await netflixMedia.getSnapshot();
      if (mounted.current) setSnapshot(next);
    } catch {
      if (mounted.current) { setSnapshot(null); setMessage('Could not read Netflix controls. Refresh to try again.'); }
    } finally { refreshing.current = false; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initial = setTimeout(() => { void refresh(); }, 0);
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 2000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => {
      mounted.current = false; clearTimeout(initial); clearInterval(timer); listener.remove();
      void netflixMedia?.cancelTest().catch(() => {});
    };
  }, [refresh]);

  async function openNetflix() {
    try { await netflixMedia?.openNetflix(); }
    catch { setMessage('Could not open Netflix. Install the official Netflix Android app and try again.'); }
  }

  function manageAccess() {
    Alert.alert('Netflix controls access',
      'Android calls this notification access. It grants broad notification privileges. Orbit uses it only to find Netflix media controls; it does not process notification text or upload this check. You can revoke access in the same settings at any time.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Android settings', onPress: () => {
          void netflixMedia?.openAccessSettings().catch(() => setMessage('Open Android Settings and search for Notification access, then choose Orbit Netflix controls.'));
        } },
      ]);
  }

  async function runTest(command: MediaCommand) {
    if (!netflixMedia || running.current) return;
    running.current = true; setTesting(true); setResult(null);
    setMessage('Netflix will open. Orbit will try ' + command + ' after 8 seconds. Return here afterward to see the result.');
    // Attach the rejection handler immediately, including if opening Netflix fails.
    const pending = netflixMedia.runTest(command).then(value => ({ value }), () => ({ value: null }));
    try {
      try { await netflixMedia.openNetflix(); }
      catch {
        await netflixMedia.cancelTest();
        throw new Error('open_failed');
      }
      const { value } = await pending;
      if (!mounted.current) return;
      if (value) { setResult(value); setMessage(netflixTestMessage(value)); }
      else setMessage('The test ended without a result. Keep Orbit running and try again.');
    } catch {
      if (mounted.current) setMessage('Could not open Netflix. The pending test was cancelled. Install the official Netflix app first.');
    } finally {
      // Wait until the native operation finishes before another test can start.
      await pending;
      running.current = false;
      if (mounted.current) { setTesting(false); void refresh(); }
    }
  }

  function confirmTest(command: MediaCommand) {
    Alert.alert('Test Netflix ' + command,
      'Orbit will open Netflix and send one ' + (command === 'seek' ? 'seek forward by 10 seconds' : command) + ' command after 8 seconds. ' +
      (command === 'play' ? 'Leave the movie paused to test play. ' : 'Leave a movie playing. ') +
      'Watch for the change, then return to Orbit. This changes playback only on this phone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start test', onPress: () => { void runTest(command); } },
      ]);
  }

  async function shareReport() {
    try { await Share.share({ title: 'Orbit Netflix controls check', message: netflixReport(snapshot, result) }); }
    catch { setMessage('Could not open sharing. You can read the result on this screen.'); }
  }

  return <View style={s.panel}>
    <Text style={s.title}>Netflix controls check</Text>
    <Text style={s.note}>First we need to confirm that Netflix accepts playback commands on this phone. Automatic two-phone sync is not connected yet.</Text>
    {!netflixMedia ? <Text style={s.note}>{Platform.OS === 'android'
      ? 'Install the new Orbit test APK to use this check. The previous build and Expo Go do not contain Netflix controls.'
      : 'Netflix controls currently require an Android phone and the Orbit test APK.'}</Text> : <>
      <Text style={s.note}>{snapshot ? netflixStatus(snapshot) : 'Reading Android media controls…'}</Text>
      <Button label={snapshot?.access === 'permission_required' ? '1. Enable Netflix controls' : 'Manage controls access'} disabled={testing} onPress={manageAccess} />
      <Button label="2. Open Netflix and start a movie" disabled={testing} onPress={() => { void openNetflix(); }} />
      <Text style={s.note}>Return to Orbit after playback starts, then run one test at a time.</Text>
      {snapshot?.session === 'active' && <>
        <Text style={s.readout}>Player: {snapshot.state} · Position: {formatPosition(snapshot.positionMs)}</Text>
        <Text style={s.note}>Reported controls: play {snapshot.canPlay ? 'yes' : 'no'} · pause {snapshot.canPause ? 'yes' : 'no'} · seek {snapshot.canSeek ? 'yes' : 'no'}</Text>
      </>}
      {snapshot?.access === 'ready' && <>
        <Text style={s.note}>Tests check the player after Netflix opens, even if Netflix hides its controls when Orbit is in front.</Text>
        <Button label="Test pause" disabled={testing} onPress={() => confirmTest('pause')} />
        <Button label="Test play" disabled={testing} onPress={() => confirmTest('play')} />
        <Button label="Test seek +10 seconds" disabled={testing} onPress={() => confirmTest('seek')} />
      </>}
      {testing && <Button label="Cancel pending test" disabled={false} onPress={() => {
        void netflixMedia?.cancelTest().then(() => setMessage('Cancellation requested. A command already sent cannot be undone.'), () => setMessage('Could not cancel. The short test will finish shortly.'));
      }} />}
      <Button label="Refresh check" disabled={testing} onPress={() => { setMessage(''); void refresh(); }} />
      <Button label="Share diagnostic result" disabled={testing || !snapshot} onPress={() => { void shareReport(); }} />
      <Text style={s.note}>Checks stay in memory. Shared diagnostics contain playback numbers and control results, with no account details or movie title.</Text>
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.note}>{message}</Text>}
  </View>;
}

function Button({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    style={[s.button, disabled && s.disabled]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#172138', borderRadius: 18, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: '#2b3552' },
  title: { color: '#fff', fontWeight: '700', fontSize: 19, marginBottom: 4 },
  note: { color: '#becae0', fontSize: 13, lineHeight: 19, marginTop: 9 },
  readout: { color: '#fff', fontSize: 14, marginTop: 14 },
  button: { backgroundColor: '#505ce0', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabled: { opacity: 0.5 }, buttonText: { color: '#fff', fontWeight: '700' },
});
