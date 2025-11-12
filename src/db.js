'use strict';
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const DB_PATH = path.join(__dirname, '..', 'data.sqlite');

// Ensure parent directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS listings (
        url TEXT PRIMARY KEY,
        title TEXT,
        price TEXT,
        address TEXT,
        workA_status TEXT,
        workA_minutes INTEGER,
        workB_status TEXT,
        workB_minutes INTEGER,
        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

function getCachedListing(url) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM listings WHERE url = ?', [url], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      resolve(row);
    });
  });
}

function saveListing(data) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO listings
      (url, title, price, address, workA_minutes, workB_minutes)
      VALUES (?, ?, ?, ?, ?, ?)`);

    stmt.run(
      data.url,
      data.title || '',
      data.price || '',
      data.address || '',
      data.workA_minutes || 9999,
      data.workB_minutes || 9999,
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
    stmt.finalize();
  });
}

module.exports = { initDb, getCachedListing, saveListing };
