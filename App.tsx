import React, { useState } from 'react';
import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrivateRoomPanel from './src/components/PrivateRoomPanel';
import NetflixCheckPanel from './src/components/NetflixCheckPanel';
import NetflixInsidePanel from './src/components/NetflixInsidePanel';
import { privacyRules } from './src/security';
import { providers, ProviderId } from './src/providers';

type TestResult = 'untested' | 'pass' | 'fail' | 'unknown';
export default function App() {
  const [providerId, setProviderId] = useState<ProviderId>('netflix');
  const [media, setMedia] = useState<TestResult>('untested');
  const [audio, setAudio] = useState<TestResult>('untested');
  const [notes, setNotes] = useState('');
  async function openProvider() {
    const selected = providers.find(p => p.id === providerId);
    if (!selected?.url) { Alert.alert('Not implemented', 'Screen sharing needs a native Android build, user consent and WebRTC. No capture has started.'); return; }
    // This compatibility lab still opens providers externally; the separate in-app test is above.
    const url = selected.url;
    try { await Linking.openURL(url); }
    catch { Alert.alert('Could not open service', 'Open the official app or site manually'); }
  }
  return <SafeAreaView style={s.page}><ScrollView contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>ORBIT / PRIVATE WATCH PARTY</Text>
    <Text style={s.title}>Your cinema, together.</Text>
    <Text style={s.subtitle}>Private rooms · In-app Netflix experiment</Text>
    <PrivateRoomPanel />
    <NetflixInsidePanel />
    <NetflixCheckPanel />
    <View style={s.panel}>
      <Text style={s.h2}>Streaming compatibility lab</Text>
      <Text style={s.label}>Choose a mode</Text>
      <View style={[s.row,{flexWrap:'wrap'}]}>{providers.map(p => <TouchableOpacity key={p.id} style={[s.chip,providerId===p.id && s.selected]} onPress={() => { setProviderId(p.id); setMedia('untested'); setAudio('untested'); }}><Text style={s.chipText}>{p.label}</Text></TouchableOpacity>)}</View>
      <Text style={s.note}>{providers.find(p => p.id===providerId)?.detail}</Text>
      <Text style={s.note}>This compatibility lab opens each provider externally. The separate Netflix panel above tests its official website inside Orbit.</Text>
      <TouchableOpacity style={s.button} onPress={openProvider}><Text style={s.buttonText}>Open service / inspect limitation</Text></TouchableOpacity>
      <Text style={s.label}>Does this service play normally?</Text>
      <View style={s.row}>{(['pass', 'fail', 'unknown'] as const).map(v => <TouchableOpacity key={v} style={[s.chip, media===v && s.selected]} onPress={() => setMedia(v)}><Text style={s.chipText}>{v}</Text></TouchableOpacity>)}</View>
      <Text style={s.label}>Can you listen to a voice call while it plays?</Text>
      <View style={s.row}>{(['pass', 'fail', 'unknown'] as const).map(v => <TouchableOpacity key={v} style={[s.chip, audio===v && s.selected]} onPress={() => setAudio(v)}><Text style={s.chipText}>{v}</Text></TouchableOpacity>)}</View>
      <TextInput placeholder="Device / service version / observations (local only)" placeholderTextColor="#9ca3af" style={[s.input, s.multiline]} value={notes} onChangeText={setNotes} multiline maxLength={500} />
      <Text style={s.note}>Result: {providerId}={media}; audio={audio}. Notes are only in app memory and disappear when the app restarts. This test does NOT yet check automatic playback control.</Text>
    </View>
    <View style={s.panel}>
      <Text style={s.h2}>Security policy</Text>
      {privacyRules.map(rule => <Text key={rule} style={s.rule}>• {rule}</Text>)}
    </View>
    <Text style={s.footer}>Full movie synchronization and voice are not ready. Netflix room tests are experimental.</Text>
  </ScrollView></SafeAreaView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0b1020'},content:{padding:22,paddingBottom:48},eyebrow:{color:'#a5b4fc',letterSpacing:2,fontWeight:'700',fontSize:11,marginTop:12},title:{color:'#fff',fontSize:30,fontWeight:'800',marginTop:10},subtitle:{color:'#bac4dd',marginTop:5,marginBottom:23},panel:{backgroundColor:'#172138',borderRadius:18,padding:17,marginBottom:16,borderWidth:1,borderColor:'#2b3552'},h2:{color:'#fff',fontWeight:'700',fontSize:19,marginBottom:12},input:{backgroundColor:'#0d162a',borderWidth:1,borderColor:'#46506c',padding:12,borderRadius:10,color:'#fff',marginBottom:11},multiline:{minHeight:72,textAlignVertical:'top',marginTop:13},button:{backgroundColor:'#505ce0',padding:14,borderRadius:10,alignItems:'center',marginBottom:11},secondaryButton:{backgroundColor:'#33415f',padding:14,borderRadius:10,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'700'},note:{color:'#becae0',fontSize:13,lineHeight:19,marginTop:9},label:{color:'#fff',fontWeight:'600',marginTop:14,marginBottom:8},row:{flexDirection:'row',gap:8},chip:{paddingVertical:9,paddingHorizontal:15,backgroundColor:'#33415f',borderRadius:9},selected:{backgroundColor:'#505ce0'},chipText:{color:'#fff',textTransform:'capitalize'},rule:{color:'#d6deee',lineHeight:23,marginBottom:7},footer:{color:'#9baaca',fontSize:12,textAlign:'center'}});
