/**
 * Définitions SQL des tables SQLite.
 * expo-sqlite v15 — API async (SDK 52).
 */

export const SQL_CREATE_EXPLORED_CELLS = `
  CREATE TABLE IF NOT EXISTS explored_cells (
    h3_index     TEXT    PRIMARY KEY,
    discovered_at INTEGER NOT NULL,
    lat           REAL    NOT NULL,
    lng           REAL    NOT NULL,
    country       TEXT,
    city          TEXT
  );
`;

export const SQL_CREATE_EXPLORED_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_explored_cells_discovered_at
  ON explored_cells (discovered_at ASC);
`;

/** Table pour les métadonnées de l'app (version de schéma, compteurs, etc.). */
export const SQL_CREATE_METADATA = `
  CREATE TABLE IF NOT EXISTS app_metadata (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

/** Table pour l'historique des succès débloqués. */
export const SQL_CREATE_ACHIEVEMENTS = `
  CREATE TABLE IF NOT EXISTS achievements (
    id           TEXT    PRIMARY KEY,
    unlocked_at  INTEGER NOT NULL
  );
`;

export const SCHEMA_VERSION = 1;
