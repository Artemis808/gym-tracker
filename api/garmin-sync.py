# Garmin sync serverless function (Vercel Python runtime) — Fenix 6 Pro Solar fields.
# Env vars: GARMIN_EMAIL, GARMIN_PASSWORD. MFA accounts: swap in your IF tracker's garmin-sync.js.
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

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            g = get_client()

            # Session heart-rate window: /api/garmin-sync?hrStart=ms&hrEnd=ms
            hs, he = q.get('hrStart', [None])[0], q.get('hrEnd', [None])[0]
            if hs and he:
                hs, he = int(hs), int(he)
                d = date.fromtimestamp(hs / 1000).isoformat()
                hr = g.get_heart_rates(d) or {}
                vals = [v[1] for v in (hr.get('heartRateValues') or []) if v and v[0] and hs <= v[0] <= he and v[1]]
                self._send(200, {
                    'avgHR': round(sum(vals) / len(vals)) if vals else None,
                    'maxHR': max(vals) if vals else None,
                    'samples': len(vals),
                })
                return

            d = q.get('date', [date.today().isoformat()])[0]
            stats = g.get_stats(d) or {}
            try:
                sleep = (g.get_sleep_data(d) or {}).get('dailySleepDTO', {}) or {}
            except Exception:
                sleep = {}

            out = {
                'date': d,
                'steps': stats.get('totalSteps'),
                'restingHR': stats.get('restingHeartRate'),
                'calories': stats.get('totalKilocalories'),
                'activeCalories': stats.get('activeKilocalories'),
                'stress': stats.get('averageStressLevel'),
                'floors': stats.get('floorsAscended'),
                'spo2': stats.get('averageSpo2') or stats.get('averageSpO2'),
                'respiration': stats.get('avgWakingRespirationValue'),
                'intensityMinutes': (stats.get('moderateIntensityMinutes') or 0) + (stats.get('vigorousIntensityMinutes') or 0),
                'bodyBattery': {
                    'high': stats.get('bodyBatteryHighestValue'),
                    'low': stats.get('bodyBatteryLowestValue'),
                },
                'sleep': {
                    'seconds': sleep.get('sleepTimeSeconds'),
                    'score': ((sleep.get('sleepScores') or {}).get('overall') or {}).get('value'),
                },
            }
            self._send(200, out)
        except Exception as e:
            self._send(500, {'error': str(e)})

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)
