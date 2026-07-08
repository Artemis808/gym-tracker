# Garmin sync (Vercel Python) — Fenix 6 Pro Solar, with layered fallbacks.
# Env vars: GARMIN_EMAIL, GARMIN_PASSWORD. MFA accounts: use the IF tracker's garmin-sync.js instead.
from http.server import BaseHTTPRequestHandler
import json, os
from urllib.parse import urlparse, parse_qs
from datetime import date

_client = None

def get_client():
    global _client
    if _client is None:
        from garminconnect import Garmin
        c = Garmin(os.environ['GARMIN_EMAIL'], os.environ['GARMIN_PASSWORD'])
        c.login()
        _client = c
    return _client

def usable(d):
    if not isinstance(d, dict):
        return False
    return any(d.get(k) is not None for k in ('totalSteps', 'restingHeartRate', 'totalKilocalories', 'steps'))

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            g = get_client()

            # Session heart-rate window: ?hrStart=ms&hrEnd=ms
            hs, he = q.get('hrStart', [None])[0], q.get('hrEnd', [None])[0]
            if hs and he:
                hs, he = int(hs), int(he)
                d = date.fromtimestamp(hs / 1000).isoformat()
                hr = g.get_heart_rates(d) or {}
                vals = [v[1] for v in (hr.get('heartRateValues') or []) if v and v[0] and hs <= v[0] <= he and v[1]]
                self._send(200, {'avgHR': round(sum(vals) / len(vals)) if vals else None,
                                 'maxHR': max(vals) if vals else None, 'samples': len(vals)})
                return

            d = q.get('date', [date.today().isoformat()])[0]

            # Daily stats: try richest source first, fall back down the chain
            stats, src = {}, 'none'
            for name, fn in (('stats_and_body', 'get_stats_and_body'), ('user_summary', 'get_user_summary'), ('stats', 'get_stats')):
                try:
                    r = getattr(g, fn)(d)
                    if usable(r):
                        stats, src = r, name
                        break
                    if isinstance(r, dict) and not stats:
                        stats, src = r, name + '(sparse)'
                except Exception:
                    continue

            # Steps fallback: sum the intraday series
            steps = stats.get('totalSteps') or stats.get('steps')
            if steps is None:
                try:
                    steps = sum(x.get('steps') or 0 for x in (g.get_steps_data(d) or [])) or None
                except Exception:
                    pass

            # Body battery fallback: scan the day's value series
            bb_hi, bb_lo = stats.get('bodyBatteryHighestValue'), stats.get('bodyBatteryLowestValue')
            if bb_hi is None:
                try:
                    arr = g.get_body_battery(d, d) or []
                    vals = [p[1] for e in arr for p in (e.get('bodyBatteryValuesArray') or []) if p and len(p) > 1 and p[1] is not None]
                    if vals:
                        bb_hi, bb_lo = max(vals), min(vals)
                except Exception:
                    pass

            try:
                sleep = (g.get_sleep_data(d) or {}).get('dailySleepDTO', {}) or {}
            except Exception:
                sleep = {}

            self._send(200, {
                'date': d, '_src': src,
                'steps': steps,
                'restingHR': stats.get('restingHeartRate'),
                'calories': stats.get('totalKilocalories'),
                'activeCalories': stats.get('activeKilocalories'),
                'stress': stats.get('averageStressLevel'),
                'floors': stats.get('floorsAscended'),
                'spo2': stats.get('averageSpo2') or stats.get('averageSpO2'),
                'respiration': stats.get('avgWakingRespirationValue'),
                'intensityMinutes': ((stats.get('moderateIntensityMinutes') or 0) + (stats.get('vigorousIntensityMinutes') or 0)) or None,
                'bodyBattery': {'high': bb_hi, 'low': bb_lo},
                'sleep': {'seconds': sleep.get('sleepTimeSeconds'),
                          'score': ((sleep.get('sleepScores') or {}).get('overall') or {}).get('value')},
            })
        except Exception as e:
            self._send(500, {'error': str(e)})

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)
