import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { backendConnection, supabase } from '../backend';
import { acquireNetflixOperation } from '../netflixOperation';
import { netflixMedia } from '../netflixMedia';
import { formatPosition } from '../netflixDiagnostics';
import { netflixContentId, netflixSyncMessage, readPlayback } from '../playbackClient';
import type { NetflixSyncResult, PlaybackRead } from '../playbackClient';

export default function RoomPlaybackPanel({ roomId, userId, isHost, revision }: {
  roomId: string; userId: string; isHost: boolean; revision: number;
}) {
  const [playback, setPlayback] = useState<PlaybackRead | null>(null);
  const [contentInput, setContentInput] = useState('');
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<NetflixSyncResult | null>(null);
  const mounted = useRef(true);
  const running = useRef(false);
  const request = useRef<AbortController | null>(null);
  const nativeReady = !!netflixMedia?.runSyncWindow && !!netflixMedia.openNetflixTitle;

  const refresh = useCallback(async () => {
    const client = supabase;
    if (!client || request.current || AppState.currentState !== 'active') return;
    const controller = new AbortController(); request.current = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
    try {
      const next = await readPlayback((name, args) => client.rpc(name, args).abortSignal(controller.signal), roomId);
      if (mounted.current && !controller.signal.aborted) setPlayback(next);
    } catch (error) {
      if (mounted.current && (timedOut || !controller.signal.aborted)) {
        setPlayback(null);
        setMessage(timedOut ? 'Room playback timed out. Check your connection and refresh.' : error instanceof Error ? error.message : 'Room playback is unavailable.');
      }
    } finally { clearTimeout(timeout); if (request.current === controller) request.current = null; }
  }, [roomId]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; request.current?.abort();
      if (running.current) void netflixMedia?.cancelTest().catch(() => {});
    };
  }, [roomId, userId, isHost]);

  useEffect(() => {
    const initial = setTimeout(() => { void refresh(); }, 0);
    const interval = setInterval(() => { void refresh(); }, 2000);
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { clearTimeout(initial); clearInterval(interval); listener.remove(); request.current?.abort(); };
  }, [refresh, revision]);

  const timeline = playback?.envelope.timeline;
  const contentId = isHost && contentInput.trim() ? netflixContentId(contentInput) : timeline?.contentId ?? null;
  const position = timeline && playback ? timeline.positionMs + (timeline.playing
    ? Math.max(0, playback.envelope.serverTimeMs + (playback.receivedAtMs - playback.sentAtMs) / 2 - timeline.anchorTimeMs) : 0) : null;

  async function loadDetectedId() {
    try {
      const snapshot = await netflixMedia?.getSnapshot();
      if (snapshot?.contentId) setContentInput(snapshot.contentId);
      else setMessage('Netflix has not exposed a supported catalog ID. You can enter an official title link, but the test will still require Netflix to report the matching identity.');
    } catch { setMessage('Could not inspect Netflix. Start the selected movie and try again.'); }
  }

  async function startTest() {
    const client = supabase; const connection = backendConnection; const native = netflixMedia;
    const runWindow = native?.runSyncWindow; const openTitle = native?.openNetflixTitle;
    if (!client || !connection || !native || !runWindow || !openTitle || !contentId || running.current) return;
    const release = acquireNetflixOperation();
    if (!release) { setMessage('Another Netflix control operation is running. Stop it before starting the room test.'); return; }
    running.current = true; setTesting(true); setResult(null); setMessage('Checking your Orbit sign-in…');
    let pending: Promise<NetflixSyncResult | null> | null = null;
    try {
      const initial = await client.auth.getSession();
      let session = initial.data.session; let authError = initial.error;
      if (!session?.expires_at || session.expires_at < Date.now() / 1000 + 120) {
        const renewed = await client.auth.refreshSession(); session = renewed.data.session; authError = renewed.error;
      }
      if (authError || !session || session.user.id !== userId || !session.expires_at || session.expires_at < Date.now() / 1000 + 120) {
        throw new Error('SIGN_IN_REQUIRED');
      }
      if (!mounted.current) return;
      setMessage('Netflix will open. The one-minute room test starts after 8 seconds. Return here afterward for results.');
      // Only Orbit's own short-lived access token enters this native operation.
      pending = runWindow.call(native, connection.projectUrl, connection.publicKey, session.access_token,
        roomId, isHost ? 'host' : 'follow', contentId).then(value => value, () => null);
      try { await openTitle.call(native, contentId); }
      catch { await native.cancelTest(); throw new Error('NETFLIX_NOT_INSTALLED'); }
      const next = await pending;
      if (mounted.current) {
        setResult(next);
        setMessage(next ? netflixSyncMessage(next) : 'The native test ended without a verified result. Refresh before retrying.');
      }
    } catch {
      if (mounted.current) setMessage('Could not start the test. Check your Orbit sign-in, the installed Netflix app, and the latest Orbit development build.');
    } finally {
      if (pending) await pending;
      release(); running.current = false;
      if (mounted.current) { setTesting(false); void refresh(); }
    }
  }

  function confirmStart() {
    Alert.alert('One-minute Netflix sync test',
      (isHost ? 'Your Netflix playback will be shared with this private room. Start the movie, then try pausing, playing and seeking inside Netflix.'
        : 'Orbit will try to match the host by changing Netflix playback on this device.') +
      ' The test starts after 8 seconds and runs for one minute. It stops if movie identity, controls or room access cannot be verified. This is not a movie-length session yet.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start test', onPress: () => { void startTest(); } },
      ]);
  }

  async function shareResult() {
    if (!result) return;
    try { await Share.share({ title: 'Orbit room sync test', message: JSON.stringify({
      diagnostic: 'Orbit one-minute Netflix sync test', automaticSyncVerified: false,
      role: isHost ? 'host' : 'follow', reason: netflixSyncMessage(result),
      reads: result.reads, published: result.published, commands: result.commands, durationMs: result.durationMs,
    }, null, 2) }); } catch { setMessage('Could not open result sharing.'); }
  }

  return <View style={s.section}>
    <Text style={s.title}>Netflix room sync · one-minute test</Text>
    <Text style={s.note}>{isHost ? 'You control playback from Netflix. Start your host test before the other person starts following.'
      : 'The host controls playback. Open the same catalog item before starting your follower test.'}</Text>
    <Text style={s.note}>Automatic Netflix control is experimental and unverified. Use normal 1× playback on both devices. This short test does not yet support a full movie session.</Text>
    {timeline ? <Text style={s.note}>Shared item: {timeline.contentId} · {timeline.playing ? 'playing' : 'paused'} · about {formatPosition(position)}</Text>
      : <Text style={s.note}>Waiting for the host to share playback.</Text>}
    {isHost && <>
      <TextInput accessibilityLabel="Netflix catalog ID or official title link" placeholder="Netflix catalog ID or official title link"
        placeholderTextColor="#9ca3af" style={s.input} value={contentInput}
        onChangeText={text => setContentInput(netflixContentId(text) ?? text.slice(0, 250))}
        autoCapitalize="none" autoCorrect={false} maxLength={250} editable={!testing} />
      <Button label="Use Netflix’s detected catalog ID" disabled={testing || !netflixMedia} onPress={() => { void loadDetectedId(); }} />
    </>}
    {!nativeReady && <Text style={s.note}>Install the updated Orbit development build to enable this room test.</Text>}
    <Button label={isHost ? 'Start one-minute host test' : 'Start one-minute follower test'}
      disabled={testing || !nativeReady || !contentId || !playback} onPress={confirmStart} />
    {testing && <Button label="Stop sync test" disabled={false} onPress={() => {
      void netflixMedia?.cancelTest().then(() => setMessage('Stopping the test…'), () => setMessage('Could not cancel. The short test will end automatically.'));
    }} />}
    <Button label="Refresh shared playback" disabled={testing} onPress={() => { setMessage(''); void refresh(); }} />
    {result && <>
      <Text style={s.note}>Room reads: {result.reads} · published changes: {result.published} · requested controls: {result.commands}</Text>
      <Button label="Share room test result" disabled={testing} onPress={() => { void shareResult(); }} />
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.note}>{message}</Text>}
  </View>;
}

function Button({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    style={[s.button, disabled && s.disabled]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}
const s = StyleSheet.create({
  section: { marginTop: 18, borderTopWidth: 1, borderTopColor: '#46506c', paddingTop: 16 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  note: { color: '#becae0', fontSize: 13, lineHeight: 19, marginTop: 9 },
  input: { backgroundColor: '#0d162a', borderWidth: 1, borderColor: '#46506c', padding: 12, borderRadius: 10, color: '#fff', marginTop: 12 },
  button: { backgroundColor: '#505ce0', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabled: { opacity: 0.5 }, buttonText: { color: '#fff', fontWeight: '700' },
});
