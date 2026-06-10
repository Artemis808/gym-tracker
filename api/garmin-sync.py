# Garmin sync serverless function (Vercel Python runtime).
# Set GARMIN_EMAIL and GARMIN_PASSWORD in Vercel -> Project -> Settings -> Environment Variables.
#
# If your Garmin account has MFA/2FA enabled and this simple login fails, copy the working
# api/garmin-sync.js from your IF tracker repo into this api/ folder instead (and delete this
# file plus requirements.txt). The app reads whatever JSON the endpoint returns.

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
            d = q.get('date', [date.today().isoformat()])[0]
            g = get_client()

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
