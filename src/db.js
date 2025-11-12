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
  )`);
});

function getCachedListing(url) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM listings WHERE url = ?', [url], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);
      const r = {
        url: row.url,
        title: row.title,
        price: row.price,
        address: row.address,
        workA: { status: row.workA_status, duration_minutes: row.workA_minutes },
        workB: { status: row.workB_status, duration_minutes: row.workB_minutes }
      };
      resolve(r);
    });
  });
}

function saveListing(listing, travel) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO listings
      (url, title, price, address, workA_status, workA_minutes, workB_status, workB_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run(
      listing.url,
      listing.title || '',
      listing.price || '',
      listing.address || '',
      travel.workA.status || '',
      travel.workA.duration_minutes || 9999,
      travel.workB.status || '',
      travel.workB.duration_minutes || 9999,
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

module.exports = { getCachedListing, saveListing };
