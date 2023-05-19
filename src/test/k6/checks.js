import { check } from 'k6';
import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { Trend } from 'k6/metrics';

export default function () {
  const res = http.get('http://test.k6.io/');
  check(res, {
    'is status 200': (r) => r.status === 200,
    'body size is 11,105 bytes': (r) => r.body.length == 11105,
    'is status 400': (r) => r.status === 400,
  });
}


export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
