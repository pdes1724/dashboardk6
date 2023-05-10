import http from 'k6/http';

export const options = {
  vus: 10,
  duration: '10s',
  thresholds: {
    'http_reqs{expected_response:true}': ['rate>10'],
  },
};

export default function () {
  http.get('https://test.k6.io/');
}
tags: {
      test_name: 'TQSV-dash'
  },
export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
