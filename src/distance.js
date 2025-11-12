'use strict';
const fetch = require('node-fetch');
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_KEY) console.warn('Warning: GOOGLE_API_KEY not set in environment. Distance requests will fail.');

async function getTravelTimes(originAddress, workA, workB) {
  // Calculate next Monday at 07:00 for rush hour traffic estimation
  const now = new Date();
  const nextMonday = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7; // 0=Sunday, 1=Monday, etc.
  nextMonday.setDate(now.getDate() + daysUntilMonday);
  nextMonday.setHours(7, 0, 0, 0);
  
  // Convert to Unix timestamp (seconds)
  const departureTime = Math.floor(nextMonday.getTime() / 1000);
  
  // Use Google Distance Matrix with traffic model for realistic rush hour times
  const dests = encodeURIComponent(`${workA}|${workB}`);
  const origins = encodeURIComponent(originAddress);
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${dests}&mode=driving&departure_time=${departureTime}&traffic_model=best_guess&key=${GOOGLE_KEY}`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Distance Matrix error ${resp.status}`);
  const data = await resp.json();
  if (data.status !== 'OK') throw new Error('Distance Matrix returned ' + JSON.stringify(data));

  // Data rows[0].elements is array of destinations
  const elements = (data.rows && data.rows[0] && data.rows[0].elements) || [];
  const out = {};
  const [elA, elB] = elements;

  out.workA = parseElement(elA);
  out.workB = parseElement(elB);
  return out;
}

function parseElement(el) {
  if (!el) return { status: 'NO_DATA', duration_minutes: 9999, text: '', distance_meters: null };
  if (el.status !== 'OK') return { status: el.status, duration_minutes: 9999, text: el.status, distance_meters: null };
  
  // Prefer duration_in_traffic over duration when available (more accurate with traffic model)
  const duration = el.duration_in_traffic || el.duration;
  const mins = Math.round((duration && duration.value) / 60);
  
  return { 
    status: 'OK', 
    duration_minutes: mins, 
    text: duration.text, 
    distance_meters: el.distance ? el.distance.value : null 
  };
}

module.exports = { getTravelTimes };
