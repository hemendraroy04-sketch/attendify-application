import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { api } from '@/api';
import { scanAndMarkAttendance } from '@/attendance';
import { stopStudentScan } from '@/ble';

export default function StudentClass() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getClass(id!).then((r) => setData(r.class)).catch((e) => Alert.alert('Error', e.message));
    return () => { void stopStudentScan(); };
  }, [id]);

  const scan = async () => {
    try {
      setScanning(true);
      setMessage('Scanning nearby teacher beacons…');
      const result = await scanAndMarkAttendance(id!);
      if (result.marked) {
        setMessage('Attendance marked successfully.');
        Alert.alert('Attendance marked', 'Your presence has been recorded for this class.');
      } else {
        setMessage(`No matching active teacher beacon found. Scanned ${result.candidates} candidate device(s).`);
      }
    } catch (e) {
      setMessage('');
      Alert.alert('BLE attendance', e instanceof Error ? e.message : 'Scan failed');
    } finally {
      await stopStudentScan();
      setScanning(false);
    }
  };

  if (!data) return <SafeAreaView style={s.container}><Text>Loading…</Text></SafeAreaView>;
  return <SafeAreaView style={s.container}><View style={s.content}><Text style={s.title}>{data.name}</Text><Text style={s.muted}>Teacher: {data.teacher.name}</Text><Text style={s.muted}>Open this class while your teacher has attendance running.</Text><Pressable style={s.button} onPress={scan} disabled={scanning}><Text style={s.buttonText}>{scanning ? 'Scanning…' : 'Scan BLE & mark attendance'}</Text></Pressable>{message&&<View style={s.info}><Text>{message}</Text></View>}</View></SafeAreaView>;
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:'#f7f7fb'},content:{padding:20,gap:14},title:{fontSize:32,fontWeight:'800'},muted:{color:'#666'},button:{backgroundColor:'#111',padding:16,borderRadius:14,alignItems:'center'},buttonText:{color:'white',fontWeight:'700'},info:{backgroundColor:'white',padding:16,borderRadius:16}})
