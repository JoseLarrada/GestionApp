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
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        observations TEXT,
        date INTEGER NOT NULL,
        transportadora_id INTEGER,
        FOREIGN KEY(transportadora_id) REFERENCES transportadoras(id)
      )
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

  } catch (error) {
    console.error('Error creando tablas:', error);
  }
};