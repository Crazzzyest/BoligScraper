const fetch = require('node-fetch');
(async () => {
  try {
    const body = {
      finnUrl: 'https://www.finn.no/realestate/homes/search.html?location=1.20016.20318&published=1&price_to=3000000&price_collective_to=3000000&sort=PRICE_ASC',
      workA: 'Prinsesse Kristinas gate 3, 7030 Trondheim',
      workB: 'Idrettsbygget Gløshaugen, Chr. Frederiks gate 20, 7030 Trondheim',
      maxMinutes: 45
    };
    const res = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error('Request failed', e);
  }
})();
