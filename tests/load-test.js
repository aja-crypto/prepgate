// k6 load test for GateNexa API
// Run: k6 run tests/load-test.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const healthTrend = new Trend('health_duration');
const predictTrend = new Trend('predict_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<5000'],
    health_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  group('health', () => {
    const res = http.get(`${BASE_URL}/health`);
    healthTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'health ok': (r) => r.status === 200 }));
    sleep(0.5);
  });

  group('predict', () => {
    const payload = JSON.stringify({
      expectedMarks: Math.floor(Math.random() * 40) + 30,
      category: ['General', 'OBC', 'SC', 'ST', 'EWS'][Math.floor(Math.random() * 5)],
      paper: 'CS',
    });
    const res = http.post(`${BASE_URL}/api/predictor/predict`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.TEST_TOKEN || ''}`,
      },
    });
    predictTrend.add(res.timings.duration);
    errorRate.add(!check(res, { 'predict ok': (r) => r.status < 500 }));
    sleep(2);
  });

  group('ai-chat', () => {
    const res = http.post(`${BASE_URL}/api/ai/chat`, JSON.stringify({
      message: 'What should I study today?',
    }), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${__ENV.TEST_TOKEN || ''}`,
      },
    });
    errorRate.add(!check(res, { 'chat ok': (r) => r.status < 500 }));
    sleep(3);
  });
}
