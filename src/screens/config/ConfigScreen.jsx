import { View, Button, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { exportBackup, importBackup } from '../../services/backupService';
import { db } from '../../db/database';
import { useState, useEffect } from 'react';

export default function ConfigScreen() {
  const scheme = useColorScheme();
  const [lastBackup, setLastBackup] = useState('');

  useEffect(() => {
    try {
      const row = db.getFirstSync(`SELECT value FROM settings WHERE key='last_backup'`);
      if (row?.value) setLastBackup(row.value);
    } catch (e) { console.error(e); }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tema: {scheme === 'dark' ? 'Oscuro' : 'Claro'}</Text>
      <Button title="Crear respaldo" onPress={exportBackup} />
      <View style={{ height: 10 }} />
      <Button title="Restaurar respaldo" onPress={importBackup} />
      <Text style={styles.backupText}>
        Último respaldo: {lastBackup ? new Date(lastBackup).toLocaleString() : 'Nunca'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 30 },
  backupText: { marginTop: 30, textAlign: 'center', fontSize: 16 },
});