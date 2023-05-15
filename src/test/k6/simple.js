import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import http from 'k6/http';
import { Trend } from 'k6/metrics';

export const options = {
  vus: 10,
  duration: '100s',
  thresholds: {
    'http_reqs{expected_response:true}': ['rate>10'],
  },
  tags: {
        test_name: 'TQSV-TestDB'
        test_id: ${__ENV.TEST_ID}
    },
  summaryTrendStats: ["min", "max", "avg","med", "p(90)", "p(95)", "count"],
};



let requestTrend1 = new Trend('Request1')

export function contacts() {
  let resp;
  resp=http.get('https://test.k6.io/')
  requestTrend1.add(resp.timings.duration)
}

export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

export default function () {
  http.get('https://test.k6.io/');
}