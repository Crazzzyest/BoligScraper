'use strict';
const fetch = require('node-fetch');
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;

if (!GOOGLE_KEY) console.warn('Warning: GOOGLE_API_KEY not set in environment. Distance requests will fail.');

async function getTravelTimes(originAddress, workA, workB, mode = 'driving') {
  // Use Google Distance Matrix to get durations for specified travel mode
  // Supported modes: driving, walking, bicycling, transit
  const dests = encodeURIComponent(`${workA}|${workB}`);
  const origins = encodeURIComponent(originAddress);
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${dests}&mode=${mode}&key=${GOOGLE_KEY}`;

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
  const mins = Math.round((el.duration && el.duration.value) / 60);
  return { status: 'OK', duration_minutes: mins, text: el.duration.text, distance_meters: el.distance ? el.distance.value : null };
}

module.exports = { getTravelTimes };
