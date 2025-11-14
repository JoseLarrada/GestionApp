import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DocumentPicker from 'expo-document-picker';
import { db } from '../db/database';

const tables = ['providers', 'categories', 'products', 'transfers', 'transportadoras', 'expenses', 'settings'];

const getAllRows = (table) => db.getAllSync(`SELECT * FROM ${table}`) || [];

export const exportBackup = async () => {
  try {
    const data = {};

    const tables = ['providers', 'categories', 'products', 'transfers', 'transportadoras', 'expenses', 'settings'];
    tables.forEach(table => {
      data[table] = db.getAllSync(`SELECT * FROM ${table}`);
    });

    const json = JSON.stringify(data, null, 2);
    const fileName = `backup_${new Date().toISOString().slice(0, 10)}.json`;
    const uri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(uri, json);

    // Actualizamos fecha del último respaldo
    db.runSync(`INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup', ?)`, [new Date().toISOString()]);

    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Respaldo Gestión App',
    });
  } catch (error) {
    Alert.alert('Error', 'No se pudo crear el respaldo: ' + error.message);
  }
};

export const importBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: false, // más rápido
    });

    // Nueva API de DocumentPicker (SDK 49+)
    if (result.canceled) {
      return;
    }

    const uri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(uri);
    const data = JSON.parse(content);

    // Todo dentro de una transacción síncrona
    db.withTransactionSync(() => {
      // 1. Borrar todo (orden importante por claves foráneas)
      const deleteOrder = [
        'expenses',
        'products',
        'transfers',
        'providers',
        'categories',
        'transportadoras',
        'settings',
      ];
      deleteOrder.forEach(table => {
        db.execSync(`DELETE FROM ${table}`);
      });

      // 2. Insertar todo (orden inverso)
      const insertOrder = [
        'providers',
        'categories',
        'transportadoras',
        'settings',
        'products',
        'expenses',
        'transfers',
      ];

      insertOrder.forEach(table => {
        const rows = data[table] || [];
        rows.forEach(row => {
          // Filtramos campos undefined/null para evitar errores
          const keys = [];
          const values = [];
          const placeholders = [];

          Object.keys(row).forEach(key => {
            if (row[key] !== undefined && row[key] !== null) {
              keys.push(key);
              values.push(row[key]);
              placeholders.push('?');
            }
          });

          if (keys.length > 0) {
            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})`;
            db.runSync(sql, values);
          }
        });
      });
    });

    // Actualizamos la fecha del último respaldo
    db.runSync(
      `INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup', ?)`,
      [new Date().toISOString()]
    );

    Alert.alert('¡Éxito!', 'Respaldo restaurado correctamente. Reinicia la app para ver los cambios.');
  } catch (error) {
    console.error('Error restaurando respaldo:', error);
    Alert.alert('Error', 'No se pudo restaurar el respaldo: ' + error.message);
  }
};