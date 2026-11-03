import React from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NetflixInsidePanel() {
  return <View style={s.panel}>
    <Text style={s.title}>Netflix inside Orbit</Text>
    <Text style={s.note}>Netflix sign-in works on the tested phone, but its website asks for the Netflix app to watch. Movie playback and automatic sync are unavailable through this browser test.</Text>
    <Link href="/netflix" asChild>
      <TouchableOpacity accessibilityRole="button" style={s.button}>
        <Text style={s.buttonText}>Open Netflix test screen</Text>
      </TouchableOpacity>
    </Link>
    <Text style={s.note}>The website now has its own full-width screen. Test details and results stay outside the page.</Text>
  </View>;
}
const s = StyleSheet.create({
  panel: { backgroundColor: '#172138', borderRadius: 18, padding: 17, marginBottom: 16, borderWidth: 1, borderColor: '#2b3552' },
  title: { color: '#fff', fontWeight: '700', fontSize: 19 },
  note: { color: '#becae0', fontSize: 13, lineHeight: 19, marginTop: 9 },
  button: { backgroundColor: '#505ce0', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 14, minHeight: 48 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
