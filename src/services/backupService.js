import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../db/database';

const DB_NAME = 'gestion.db';

// Exportar backup de la base de datos
export const exportBackup = async () => {
  try {
    // Cerrar la base de datos temporalmente
    db.closeSync();

    // Generar nombre con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFileName = `gestion_backup_${timestamp}.db`;

    // Obtener referencias a los archivos usando la nueva API
    const dbFile = new File(Paths.document, 'SQLite', DB_NAME);
    const backupFile = new File(Paths.cache, backupFileName);

    // Leer el contenido de la base de datos como bytes
    const dbContent = await dbFile.bytes;

    // Crear y escribir en el archivo de backup
    await backupFile.create();
    backupFile.bytes = dbContent;

    // Reabrir la base de datos
    const { openDatabaseSync } = require('expo-sqlite');
    const newDb = openDatabaseSync(DB_NAME);
    Object.assign(db, newDb);

    // Obtener la URI del archivo para compartir
    const backupUri = backupFile.uri;

    // Compartir el archivo
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(backupUri, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Guardar backup de base de datos',
      });
    } else {
      throw new Error('No se puede compartir archivos en este dispositivo');
    }

    console.log('Backup exportado exitosamente:', backupUri);
    return backupUri;
  } catch (error) {
    // Asegurarse de reabrir la DB si algo falla
    try {
      const { openDatabaseSync } = require('expo-sqlite');
      const newDb = openDatabaseSync(DB_NAME);
      Object.assign(db, newDb);
    } catch (reopenError) {
      console.error('Error al reabrir DB:', reopenError);
    }
    
    console.error('Error al exportar backup:', error);
    throw error;
  }
};

// Importar backup de la base de datos
export const importBackup = async () => {
  try {
    // Seleccionar archivo de backup
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error('Selección cancelada');
    }

    const selectedFile = result.assets[0];

    // Cerrar la base de datos actual
    db.closeSync();

    // Crear backup de seguridad de la DB actual antes de reemplazar
    try {
      const dbFile = new File(Paths.document, 'SQLite', DB_NAME);
      const backupFileName = `backup_before_restore_${Date.now()}.db`;
      const backupFile = new File(Paths.cache, backupFileName);
      
      const dbContent = await dbFile.bytes;
      await backupFile.create();
      backupFile.bytes = dbContent;
      
      console.log('Backup de seguridad creado antes de restaurar');
    } catch (backupError) {
      console.warn('No se pudo crear backup de seguridad:', backupError);
    }

    // Leer el contenido del archivo seleccionado
    const selectedFileObj = new File(selectedFile.uri);
    const backupContent = await selectedFileObj.bytes;

    // Escribir el nuevo contenido en la DB
    const dbFile = new File(Paths.document, 'SQLite', DB_NAME);
    dbFile.bytes = backupContent;

    // Reabrir la base de datos
    const { openDatabaseSync } = require('expo-sqlite');
    const newDb = openDatabaseSync(DB_NAME);
    Object.assign(db, newDb);

    console.log('Backup importado exitosamente desde:', selectedFile.uri);
    return true;
  } catch (error) {
    console.error('Error al importar backup:', error);
    
    // Intentar reabrir la DB
    try {
      const { openDatabaseSync } = require('expo-sqlite');
      const newDb = openDatabaseSync(DB_NAME);
      Object.assign(db, newDb);
    } catch (reopenError) {
      console.error('Error al reabrir DB:', reopenError);
    }
    
    throw error;
  }
};