import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { backendSetupMessage, readRoomResult, supabase } from '../backend';
import type { RemoteRoom, RoomMember } from '../backend';
import { normalizeInvitationCode } from '../room';
import { googleSignInSetupMessage, signInWithGoogle } from '../googleSignIn';
import { isRoomApprovalRequired, roomErrorMessage } from '../roomErrors';

export default function PrivateRoomPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [nickname, setNickname] = useState('');
  const [invitation, setInvitation] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<RemoteRoom | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [roomAccess, setRoomAccess] = useState<'unknown' | 'allowed' | 'denied'>('unknown');
  const [accessCheck, setAccessCheck] = useState(0);
  const [message, setMessage] = useState('');
  const [connection, setConnection] = useState('Connecting…');
  const [resendAt, setResendAt] = useState(0);
  const operation = useRef(false);
  const authUser = useRef<string | null>(null);
  const userId = session?.user.id;

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, next) => {
      const nextId = next?.user.id ?? null;
      if (authUser.current !== nextId) {
        authUser.current = nextId;
        setRoomId(null); setRoom(null); setMembers([]); setShareCode(null);
        setRestoring(!!next); setRoomAccess('unknown'); setMessage('');
      }
      setSession(next);
    });
    function refreshAuth(state: string | null | undefined) {
      if (state === 'active') client!.auth.startAutoRefresh();
      else client!.auth.stopAutoRefresh();
    }
    refreshAuth(AppState.currentState);
    const listener = AppState.addEventListener('change', refreshAuth);
    return () => { subscription.unsubscribe(); listener.remove(); client.auth.stopAutoRefresh(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userId || !supabase) return;
    const client = supabase;
    void (async () => {
      try {
        const { data, error } = await client.rpc('orbit_restore_room');
        if (error) throw error;
        if (!cancelled) {
          setRoomAccess('allowed');
          setRoomId(typeof data === 'string' ? data : null);
        }
      } catch (error) {
        if (!cancelled) {
          setRoomAccess(isRoomApprovalRequired(error) ? 'denied' : 'unknown');
          setMessage(roomErrorMessage(error));
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, accessCheck]);

  useEffect(() => {
    const client = supabase;
    if (!client || !roomId || !userId) return;
    let cancelled = false;
    let refreshing = false;
    async function refresh() {
      if (cancelled || refreshing || AppState.currentState !== 'active') return;
      refreshing = true;
      try {
        const [roomResponse, membersResponse] = await Promise.all([
          client!.from('orbit_rooms').select('id,host_id,expires_at,closed,revision').eq('id', roomId!).maybeSingle(),
          client!.from('orbit_members').select('user_id,nickname').eq('room_id', roomId!).order('joined_at'),
        ]);
        if (roomResponse.error) throw roomResponse.error;
        if (membersResponse.error) throw membersResponse.error;
        if (cancelled) return;
        if (!roomResponse.data || !membersResponse.data?.some(m => m.user_id === userId)) {
          setRoomId(null); setRoom(null); setMembers([]); setShareCode(null);
          setMessage('This room ended, expired, or your account no longer has access.');
          return;
        }
        setRoom(roomResponse.data as RemoteRoom);
        setMembers(membersResponse.data as RoomMember[]);
        setMessage('');
      } catch {
        if (!cancelled) setMessage('Room updates are unavailable. Check your connection; the member list may be out of date.');
      } finally { refreshing = false; }
    }
    void refresh();
    // Only room UPDATE events are published. Read the authorized roster afresh.
    const channel = client.channel('orbit-room-' + roomId)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orbit_rooms', filter: 'id=eq.' + roomId,
      }, () => { void refresh(); })
      .subscribe(status => {
        if (cancelled) return;
        setConnection(status === 'SUBSCRIBED' ? 'Live room updates' : 'Reconnecting · checking every 5 seconds');
        if (status === 'SUBSCRIBED') void refresh();
      });
    // Also detects expiration/closure/revocation, for which RLS blocks events.
    const timer = setInterval(() => { void refresh(); }, 5000);
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') void refresh();
    });
    return () => {
      cancelled = true; clearInterval(timer); listener.remove();
      void client.removeChannel(channel);
    };
  }, [roomId, userId]);

  const run = useCallback(async (action: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true; setBusy(true); setMessage('');
    try { await action(); }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'The request could not be completed. Check your connection and setup.');
    } finally { operation.current = false; setBusy(false); }
  }, []);

  function checkRoomAccess() {
    if (busy || restoring) return;
    setMessage(''); setRestoring(true); setRoomAccess('unknown');
    setAccessCheck(value => value + 1);
  }

  function googleSignIn() {
    void run(async () => {
      const result = await signInWithGoogle();
      setOtp(''); setSentTo('');
      if (result === 'cancelled') setMessage('Google sign-in cancelled.');
    });
  }

  function requestCode() {
    void run(async () => {
      if (!supabase) return;
      const address = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter your Orbit account email.');
      if (Date.now() < resendAt) throw new Error('Please wait a minute before requesting another code.');
      const { error } = await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
      if (error) throw new Error('Could not request a code. Check your email, account invitation, and email delivery setup.');
      setSentTo(address); setOtp(''); setResendAt(Date.now() + 60000);
      setMessage('If this account can sign in, an Orbit code has been emailed. Enter it below.');
    });
  }
  function verifyCode() {
    void run(async () => {
      if (!supabase || !sentTo) return;
      if (!/^\d{6,10}$/.test(otp.trim())) throw new Error('Enter the numeric sign-in code from your email.');
      const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: otp.trim(), type: 'email' });
      if (error) throw new Error('That code could not be verified. Check it or request a new code.');
      setOtp(''); setSentTo('');
    });
  }
  function enterRoom(create: boolean) {
    void run(async () => {
      if (!supabase) return;
      const name = nickname.trim();
      if (!name) throw new Error('Enter a nickname first.');
      const code = normalizeInvitationCode(invitation);
      if (!create && !code) throw new Error('Use the 12-character invitation from a created Orbit room. Codes use letters and digits 2–9; 0 and 1 are not used.');
      const { data, error } = create
        ? await supabase.rpc('orbit_create_room', { p_nickname: name })
        : await supabase.rpc('orbit_join_room', { p_code: code, p_nickname: name });
      if (error) {
        if (isRoomApprovalRequired(error)) setRoomAccess('denied');
        throw new Error(roomErrorMessage(error));
      }
      const result = readRoomResult(data);
      setShareCode(create ? result.code ?? null : code);
      setRoomId(result.room_id!); setInvitation('');
    });
  }
  async function leave() {
    if (!supabase || !roomId) return;
    const { error } = await supabase.rpc('orbit_leave_room', { p_room_id: roomId });
    if (error) throw new Error(roomErrorMessage(error));
    setRoomId(null); setRoom(null); setMembers([]); setShareCode(null);
  }
  function signOut() {
    void run(async () => {
      if (!supabase) return;
      if (roomId) await leave();
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Could not sign out. Please try again.');
      setSession(null); setOtp(''); setSentTo(''); setMessage('');
    });
  }

  return <View style={s.panel}>
    <Text style={s.title}>Private room</Text>
    {backendSetupMessage ? <Text style={s.note}>{backendSetupMessage}</Text> : !session ? <>
      <Text style={s.note}>Sign in to your Orbit account. Room access requires approval from the Orbit owner.</Text>
      <Button label="Continue with Google" disabled={busy || !!googleSignInSetupMessage} onPress={googleSignIn} />
      {!!googleSignInSetupMessage && <Text style={s.note}>{googleSignInSetupMessage}</Text>}
      <Text style={s.note}>Or use an email code for an existing Orbit account.</Text>
      <TextInput accessibilityLabel="Orbit account email" placeholder="Your Orbit email" placeholderTextColor="#9ca3af"
        style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} />
      <Button label={sentTo ? 'Send another sign-in code' : 'Email sign-in code'} disabled={busy} onPress={requestCode} />
      {!!sentTo && <>
        <Text style={s.note}>Code sent to {sentTo}</Text>
        <TextInput accessibilityLabel="Email sign-in code" placeholder="Email sign-in code" placeholderTextColor="#9ca3af"
          style={s.input} value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={10} secureTextEntry editable={!busy} />
        <Button label="Sign in" disabled={busy} onPress={verifyCode} />
      </>}
    </> : <>
      <Text style={s.note}>Signed in as {session.user.email}. Sign in again after restarting Orbit.</Text>
      {restoring ? <Text style={s.note}>Checking room access…</Text> : roomAccess !== 'allowed' ? <>
        <Text style={s.note}>{roomAccess === 'denied'
          ? 'Google or email sign-in succeeded. This account still needs approval to use rooms.'
          : 'Room access has not been confirmed. Check your connection and try again.'}</Text>
        <Button label="Check room access again" disabled={busy} onPress={checkRoomAccess} />
      </> : roomId ? <>
        <Text style={s.note}>{connection}</Text>
        {shareCode ? <Text selectable style={s.code}>{shareCode.match(/.{1,4}/g)?.join('-')}</Text>
          : <Text style={s.note}>Your room was restored. The invitation is shown only when creating or joining. Leave and create a new room if you need a new code.</Text>}
        <Text style={s.note}>Share the invitation privately with an authorized Orbit user.</Text>
        <Text style={s.note}>{room ? members.length + ' / 10 members' : 'Loading members…'}</Text>
        {members.map(member => <Text key={member.user_id} style={s.member}>
          {member.nickname}{member.user_id === userId ? ' (you)' : ''}{member.user_id === room?.host_id ? ' · host' : ''}
        </Text>)}
        <Text style={s.note}>Members stay listed until they leave. Closing the app does not mark them offline. Rooms expire after 24 hours.</Text>
        <Button label={room?.host_id === userId ? 'End room for everyone' : 'Leave room'} disabled={busy} onPress={() => { void run(leave); }} />
      </> : <>
        <TextInput accessibilityLabel="Your nickname" placeholder="Your nickname" placeholderTextColor="#9ca3af" style={s.input}
          value={nickname} onChangeText={setNickname} maxLength={32} editable={!busy} />
        <Button label="Create private room" disabled={busy} onPress={() => enterRoom(true)} />
        <TextInput accessibilityLabel="Room invitation code" placeholder="12-character invitation code" placeholderTextColor="#9ca3af"
          style={s.input} value={invitation} onChangeText={setInvitation} maxLength={14} autoCapitalize="characters" autoCorrect={false} editable={!busy} />
        <Button label="Join private room" disabled={busy} onPress={() => enterRoom(false)} />
      </>}
      <Button label="Sign out" disabled={busy || restoring} onPress={signOut} />
    </>}
    {busy && <Text style={s.note}>Working…</Text>}
    {!!message && <Text accessibilityLiveRegion="polite" style={s.note}>{message}</Text>}
    <Text style={s.note}>Voice and synchronized playback are not connected yet.</Text>
  </View>;
}

function Button({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    style={[s.button, disabled && s.disabled]} onPress={onPress}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#172138', borderRadius: 18, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: '#2b3552' },
  title: { color: '#fff', fontWeight: '700', fontSize: 19, marginBottom: 12 },
  input: { backgroundColor: '#0d162a', borderWidth: 1, borderColor: '#46506c', padding: 12, borderRadius: 10, color: '#fff', marginTop: 12, marginBottom: 11 },
  button: { backgroundColor: '#505ce0', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  note: { color: '#becae0', fontSize: 13, lineHeight: 19, marginTop: 9 },
  member: { color: '#fff', fontSize: 15, marginTop: 10 },
  code: { color: '#fff', fontSize: 23, fontWeight: '700', marginTop: 14, letterSpacing: 1 },
});
