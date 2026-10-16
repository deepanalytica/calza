PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('venta','arriendo')),
  category TEXT NOT NULL CHECK(category IN ('departamento','casa','terreno','local','oficina','bodega','otro')),
  commune TEXT NOT NULL,
  neighborhood TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL CHECK(amount > 0),
  currency TEXT NOT NULL CHECK(currency IN ('UF','CLP')),
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  parking INTEGER NOT NULL DEFAULT 0,
  area_m2 REAL NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','network')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_listing_discovery ON listings(visibility,status,operation,category,commune);
CREATE INDEX IF NOT EXISTS idx_listing_owner ON listings(user_id,updated_at);

CREATE TABLE IF NOT EXISTS demands (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('venta','arriendo')),
  category TEXT NOT NULL CHECK(category IN ('departamento','casa','terreno','local','oficina','bodega','otro')),
  commune TEXT NOT NULL,
  max_amount REAL NOT NULL CHECK(max_amount > 0),
  currency TEXT NOT NULL CHECK(currency IN ('UF','CLP')),
  min_bedrooms INTEGER NOT NULL DEFAULT 0,
  min_bathrooms INTEGER NOT NULL DEFAULT 0,
  min_parking INTEGER NOT NULL DEFAULT 0,
  min_area_m2 REAL NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_demands_owner ON demands(user_id,updated_at);
