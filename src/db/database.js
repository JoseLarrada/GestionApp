import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('gestion.db');

export const initDatabase = () => {
  try {
    db.execSync('PRAGMA journal_mode = WAL;'); // Mejora rendimiento

    db.execSync(`
      CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        notes TEXT
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        provider_id INTEGER,
        category_id INTEGER,
        observations TEXT,
        FOREIGN KEY(provider_id) REFERENCES providers(id),
        FOREIGN KEY(category_id) REFERENCES categories(id)
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        account_type TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        observations TEXT,
        date INTEGER NOT NULL
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS transportadoras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        observations TEXT
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS domiciliarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        observations TEXT
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        observations TEXT,
        date INTEGER NOT NULL,
        transportadora_id INTEGER,
        domiciliario_id INTEGER,
        FOREIGN KEY(transportadora_id) REFERENCES transportadoras(id),
        FOREIGN KEY(domiciliario_id) REFERENCES domiciliarios(id)
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS base (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        observations TEXT,
        date INTEGER NOT NULL
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Migración: Agregar columna domiciliario_id si no existe
    try {
      db.execSync(`
        ALTER TABLE expenses ADD COLUMN domiciliario_id INTEGER REFERENCES domiciliarios(id)
      `);
      console.log('Columna domiciliario_id agregada a expenses');
    } catch (e) {
      // La columna ya existe, no hacer nada
      if (!e.message.includes('duplicate column name')) {
        console.error('Error en migración:', e);
      }
    }

  } catch (error) {
    console.error('Error creando tablas:', error);
  }
};

// Funciones helper para manejar la base de caja
export const getBaseBalance = () => {
  try {
    const totalBase = db.getFirstSync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM base`
    )?.total || 0;

    const totalExpenses = db.getFirstSync(
      `SELECT COALESCE(SUM(amount), 0) as total FROM expenses`
    )?.total || 0;

    return totalBase - totalExpenses;
  } catch (e) {
    console.error('Error calculando balance:', e);
    return 0;
  }
};

export const addBase = (amount, observations = null) => {
  try {
    db.runSync(
      `INSERT INTO base (amount, observations, date) VALUES (?, ?, ?)`,
      [amount, observations, Date.now()]
    );
    return true;
  } catch (e) {
    console.error('Error agregando base:', e);
    return false;
  }
};

export const getBaseHistory = () => {
  try {
    return db.getAllSync(
      `SELECT * FROM base ORDER BY date DESC`
    );
  } catch (e) {
    console.error('Error obteniendo historial de base:', e);
    return [];
  }
};