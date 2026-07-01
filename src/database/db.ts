import * as SQLite from 'expo-sqlite';
import type { ExploredCell, DBCellRow } from '@/types';
import {
  SQL_CREATE_EXPLORED_CELLS,
  SQL_CREATE_EXPLORED_INDEX,
  SQL_CREATE_METADATA,
  SQL_CREATE_ACHIEVEMENTS,
  SCHEMA_VERSION,
} from './schema';

// ─── Singleton ────────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Retourne (ou crée) l'instance singleton de la base de données.
 * Utilise openDatabaseSync (expo-sqlite v15) pour une initialisation synchrone.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('explore-map.db');
  }
  return _db;
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Crée les tables si elles n'existent pas et applique les migrations.
 * À appeler une seule fois au démarrage de l'app (dans le root layout).
 */
export async function initDatabase(): Promise<void> {
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(SQL_CREATE_EXPLORED_CELLS);
    await db.runAsync(SQL_CREATE_EXPLORED_INDEX);
    await db.runAsync(SQL_CREATE_METADATA);
    await db.runAsync(SQL_CREATE_ACHIEVEMENTS);
  });

  // Migration pour ajouter les colonnes country et city si elles n'existent pas
  try {
    await db.runAsync('ALTER TABLE explored_cells ADD COLUMN country TEXT;');
  } catch (e) {
    // La colonne existe déjà, on ignore l'erreur
  }
  try {
    await db.runAsync('ALTER TABLE explored_cells ADD COLUMN city TEXT;');
  } catch (e) {
    // La colonne existe déjà, on ignore l'erreur
  }

  // Stocker la version du schéma pour les migrations futures
  await db.runAsync(
    'INSERT OR IGNORE INTO app_metadata (key, value) VALUES (?, ?)',
    ['schema_version', String(SCHEMA_VERSION)]
  );
}

// ─── Écriture ─────────────────────────────────────────────────────────────────

/**
 * Insère une cellule explorée. Utilise INSERT OR IGNORE pour être idempotent.
 */
export async function insertCell(cell: ExploredCell): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO explored_cells (h3_index, discovered_at, lat, lng, country, city)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cell.index, cell.discoveredAt, cell.lat, cell.lng, cell.country ?? null, cell.city ?? null]
  );
}

/**
 * Insère plusieurs cellules en une seule transaction.
 * Idéal pour la synchronisation ou l'import de données.
 */
export async function insertCellsBatch(cells: ExploredCell[]): Promise<void> {
  if (cells.length === 0) return;
  const db = getDatabase();
  await db.withTransactionAsync(async () => {
    for (const cell of cells) {
      await db.runAsync(
        `INSERT OR IGNORE INTO explored_cells (h3_index, discovered_at, lat, lng, country, city)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cell.index, cell.discoveredAt, cell.lat, cell.lng, cell.country ?? null, cell.city ?? null]
      );
    }
  });
}

// ─── Lecture ──────────────────────────────────────────────────────────────────

/**
 * Charge toutes les cellules explorées, triées par ordre chronologique.
 * Résultat utilisé au démarrage pour reconstruire le store Zustand.
 */
export async function loadAllCells(): Promise<ExploredCell[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT h3_index, discovered_at, lat, lng, country, city FROM explored_cells ORDER BY discovered_at ASC'
  );
  return rows.map((row) => ({
    index: row.h3_index,
    discoveredAt: row.discovered_at,
    lat: row.lat,
    lng: row.lng,
    country: row.country,
    city: row.city,
  }));
}

/**
 * Retourne le nombre total de cellules stockées.
 */
export async function getCellCount(): Promise<number> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM explored_cells'
  );
  return result?.count ?? 0;
}

/**
 * Vérifie si un index H3 existe déjà en base.
 * Utilisé comme fallback si le Set en mémoire n'est pas disponible.
 */
export async function cellExists(h3Index: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ exists: number }>(
    'SELECT 1 AS exists FROM explored_cells WHERE h3_index = ? LIMIT 1',
    [h3Index]
  );
  return result?.exists === 1;
}

/**
 * Retourne une valeur de métadonnée par clé.
 */
export async function getMetadata(key: string): Promise<string | null> {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
}

/**
 * Enregistre ou met à jour une valeur de métadonnée.
 */
export async function setMetadata(key: string, value: string): Promise<void> {
  const db = getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?, ?)',
    [key, value]
  );
}
