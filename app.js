const GROQ_API_KEY = 'PASTE_YOUR_GROQ_KEY_HERE';

async function callAI(prompt) {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'PASTE_YOUR_GROQ_KEY_HERE') {
    return generateDemoData(prompt);
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a travel fare assistant. Always respond with valid JSON only. No markdown, no explanation, no code fences. Just raw JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500, temperature: 0.7
      })
    });
    if (!res.ok) return generateDemoData(prompt);
    const data = await res.json();
    const text = data.choices[0].message.content;
    return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  } catch (e) {
    return generateDemoData(prompt);
  }
}

// ── Route distances (km) ──────────────────────────────
const ROUTES = {
  'hyderabad-mumbai':700,'hyderabad-delhi':1500,'hyderabad-bangalore':570,
  'hyderabad-bengaluru':570,'hyderabad-chennai':625,'hyderabad-kolkata':1200,
  'hyderabad-pune':560,'hyderabad-ahmedabad':1050,'hyderabad-goa':580,
  'hyderabad-jaipur':1400,'hyderabad-nagpur':500,'hyderabad-vijayawada':270,
  'hyderabad-visakhapatnam':620,'mumbai-delhi':1400,'mumbai-bangalore':980,
  'mumbai-bengaluru':980,'mumbai-chennai':1330,'mumbai-kolkata':1900,
  'mumbai-pune':150,'mumbai-ahmedabad':530,'mumbai-goa':590,
  'mumbai-jaipur':1150,'mumbai-nagpur':860,'mumbai-surat':280,
  'delhi-bangalore':2150,'delhi-bengaluru':2150,'delhi-chennai':2200,
  'delhi-kolkata':1500,'delhi-ahmedabad':950,'delhi-jaipur':280,
  'delhi-pune':1450,'delhi-goa':1900,'delhi-lucknow':550,
  'delhi-patna':1000,'delhi-chandigarh':250,'delhi-amritsar':450,'delhi-agra':210,
  'bangalore-chennai':350,'bengaluru-chennai':350,'bangalore-kolkata':1870,
  'bengaluru-kolkata':1870,'bangalore-pune':840,'bengaluru-pune':840,
  'bangalore-goa':560,'bengaluru-goa':560,'bangalore-mysore':150,'bengaluru-mysore':150,
  'bangalore-coimbatore':360,'bengaluru-coimbatore':360,
  'chennai-kolkata':1650,'chennai-pune':1200,'chennai-goa':1050,
  'chennai-madurai':460,'chennai-coimbatore':500,
  'kolkata-pune':1950,'kolkata-bhubaneswar':440,'kolkata-patna':570,
  'pune-goa':450,'pune-ahmedabad':660,'ahmedabad-jaipur':670,
  'jaipur-agra':240,'lucknow-patna':470
};

function getDistance(from, to) {
  const f = from.toLowerCase().trim();
  const t = to.toLowerCase().trim();
  const d = ROUTES[f+'-'+t] || ROUTES[t+'-'+f];
  if (d) return d;
  let h = 0;
  for (const c of (f+t).split('').sort().join('')) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return 300 + (h % 1500);
}

function getBasePrice(km, mode) {
  if (mode === 'flight') {
    if (km < 300) return 2800;
    if (km < 600) return Math.round(km * 4.5);
    if (km < 1200) return Math.round(km * 4.0);
    return Math.round(km * 3.5);
  } else if (mode === 'train') {
    if (km < 200) return 350;
    if (km < 500) return Math.round(km * 1.4);
    if (km < 1000) return Math.round(km * 1.2);
    return Math.round(km * 1.0);
  } else {
    if (km < 200) return 250;
    if (km < 500) return Math.round(km * 0.9);
    if (km < 1000) return Math.round(km * 0.75);
    return Math.round(km * 0.6);
  }
}

// ── Parse a date label like "Mon, 30 Jun" or "Sat 27 Jun" ──
function parseDateLabel(label) {
  const match = label.match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (!match) return null;
  const day = parseInt(match[1]);
  const months = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const month = months[match[2].toLowerCase().slice(0,3)];
  if (month === undefined) return null;
  const year = new Date().getFullYear();
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

// ── Demo data generator ───────────────────────────────
function generateDemoData(prompt) {
  const isTrend = prompt.includes('"days"') || prompt.includes('trend');

  const fromMatch = prompt.match(/"([^"]+)" to "([^"]+)"/);
  const from = fromMatch ? fromMatch[1] : 'Origin';
  const to   = fromMatch ? fromMatch[2] : 'Destination';
  const mode = prompt.includes('flight') ? 'flight' : prompt.includes('train') ? 'train' : 'bus';

  // Extract date range from prompt: "week: Sat, 27 Jun – Fri, 3 Jul"
  const rangeMatch = prompt.match(/week[:\s]+([^\u2013\-\n]+)\s*[\u2013\-]\s*([^\n\.\"]+)/i);
  let startDate = null;
  let endDate   = null;
  if (rangeMatch) {
    startDate = parseDateLabel(rangeMatch[1].trim());
    endDate   = parseDateLabel(rangeMatch[2].trim());
  }
  if (!startDate) { startDate = new Date(); }
  if (!endDate)   { endDate = new Date(startDate.getTime() + 6 * 86400000); }

  // Number of days in the selected range
  const numDays = Math.max(1, Math.round((endDate - startDate) / 86400000) + 1);

  const km   = getDistance(from, to);
  const base = getBasePrice(km, mode);

  const operatorList = {
    flight: ['IndiGo','Air India','SpiceJet','Vistara','GoFirst','AirAsia','Akasa Air'],
    train:  ['Rajdhani Express','Shatabdi Express','Duronto Express','Vande Bharat','Garib Rath','Jan Shatabdi','Humsafar Express'],
    bus:    ['TSRTC Volvo','KSRTC Express','RedBus AC Sleeper','Orange Travels','SRS Travels','VRL Travels','Chartered Bus']
  };
  const ops = operatorList[mode];

  // Weekday price multipliers (0=Sun,1=Mon,...,6=Sat)
  const dayMultiplier = [1.12, 1.00, 0.82, 0.87, 0.93, 1.18, 1.38];
  const dayNotes      = ['Sunday deal','Moderate','Cheapest day!','Mid-week deal','Average','Weekend surge','Peak price'];

  const options = Array.from({length: numDays}, (_, i) => {
    const date = new Date(startDate.getTime() + i * 86400000);
    const dateStr = date.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
    const wd = date.getDay(); // 0=Sun,6=Sat
    const nudge = 1 + (((km * 7 + i * 53) % 9) - 4) / 100;
    const price = Math.round(base * dayMultiplier[wd] * nudge / 50) * 50;
    const speed = mode === 'flight' ? 750 : mode === 'train' ? 80 : 55;
    const extra = mode === 'flight' ? 0.75 : 0;
    const totalHrs = km / speed + extra;
    const h = Math.floor(totalHrs);
    const minsRaw = Math.round(((totalHrs - h) * 60 + (i % 3 === 0 ? 10 : 0)) / 5) * 5;
    const finalH = minsRaw >= 60 ? h + 1 : h;
    const finalM = minsRaw >= 60 ? minsRaw - 60 : minsRaw;
    return {
      date: dateStr,
      operator: ops[i % ops.length],
      price,
      duration: finalH + 'h ' + (finalM < 10 ? '0'+finalM : finalM) + 'm',
      note: dayNotes[wd]
    };
  });

  const prices   = options.map(o => o.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a,b) => a+b, 0) / prices.length);
  const bestDay  = options.find(o => o.price === minPrice);
  const worstDay = options.find(o => o.price === maxPrice);

  if (isTrend) {
    return JSON.stringify({
      route_valid: true, days: options,
      min_price: minPrice, max_price: maxPrice, avg_price: avgPrice,
      best_day:  bestDay  ? bestDay.date  : 'Tuesday',
      worst_day: worstDay ? worstDay.date : 'Saturday',
      trend_insight: `${from} to ${to} by ${mode} (~${km}km): Prices are lowest mid-week and highest on weekends. The ${numDays}-day range shows a spread of ${formatINR(maxPrice - minPrice)} between cheapest and most expensive days.`,
      saving_tip: `Book on ${bestDay ? bestDay.date : 'Tuesday'} for the best fare at ${formatINR(minPrice)}. Avoid ${worstDay ? worstDay.date : 'Saturday'} when prices peak at ${formatINR(maxPrice)}.`
    });
  }

  return JSON.stringify({
    route_valid: true, options,
    insight: `${from} to ${to} by ${mode} (~${km}km): Cheapest on ${bestDay ? bestDay.date : 'Tuesday'} at ${formatINR(minPrice)}. Most expensive ${worstDay ? worstDay.date : 'Saturday'} at ${formatINR(maxPrice)}. Book early to save ${formatINR(maxPrice - minPrice)}.`,
    avg_price: avgPrice
  });
}

// ── Auth ──────────────────────────────────────────────
function authGetUsers() { return JSON.parse(localStorage.getItem('fw_users') || '[]'); }
function authSaveUsers(u) { localStorage.setItem('fw_users', JSON.stringify(u)); }
function authGetUser() {
  const uid = localStorage.getItem('fw_session');
  if (!uid) return null;
  return authGetUsers().find(u => u.id === uid) || null;
}
function authLogin(email, pass) {
  if (!email || !pass) return { ok: false, error: 'Please fill in all fields.' };
  const user = authGetUsers().find(u => u.email === email.toLowerCase() && u.password === btoa(pass));
  if (!user) return { ok: false, error: 'Incorrect email or password.' };
  localStorage.setItem('fw_session', user.id);
  return { ok: true, user };
}
function authSignup(name, email, pass) {
  const users = authGetUsers();
  if (users.find(u => u.email === email.toLowerCase()))
    return { ok: false, error: 'An account with this email already exists.' };
  const user = { id:'u_'+Date.now(), name, email:email.toLowerCase(), password:btoa(pass), createdAt:Date.now() };
  users.push(user);
  authSaveUsers(users);
  localStorage.setItem('fw_session', user.id);
  return { ok: true, user };
}
function authLogout() { localStorage.removeItem('fw_session'); window.location.href = 'index.html'; }

// ── History ───────────────────────────────────────────
function getHistory() {
  const user = authGetUser();
  return user ? JSON.parse(localStorage.getItem('fw_history_'+user.id) || '[]') : [];
}
function saveSearch(record) {
  const user = authGetUser();
  if (!user) return;
  const hist = getHistory();
  hist.unshift({...record, id:'h_'+Date.now(), savedAt:Date.now()});
  localStorage.setItem('fw_history_'+user.id, JSON.stringify(hist.slice(0,30)));
}

// ── Alerts ────────────────────────────────────────────
function getAlerts() {
  const user = authGetUser();
  return user ? JSON.parse(localStorage.getItem('fw_alerts_'+user.id) || '[]') : [];
}
function saveAlert(alert) {
  const user = authGetUser();
  if (!user) return;
  const alerts = getAlerts();
  alerts.unshift({...alert, id:'a_'+Date.now(), createdAt:Date.now(), triggered:false});
  localStorage.setItem('fw_alerts_'+user.id, JSON.stringify(alerts));
}
function deleteAlert(id) {
  const user = authGetUser();
  if (!user) return;
  localStorage.setItem('fw_alerts_'+user.id, JSON.stringify(getAlerts().filter(a => a.id !== id)));
}

// ── Utils ─────────────────────────────────────────────
function formatINR(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function getWeekDates(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({length:7}, (_,i) => { const dt = new Date(mon); dt.setDate(mon.getDate()+i); return dt; });
}
function fmtDate(d) { return d.toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short'}); }
function safeParseJSON(text) {
  if (typeof text === 'object') return text;
  try { return JSON.parse(text); } catch (_) {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('Could not parse response. Try again.');
}
