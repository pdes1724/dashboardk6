import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { Trend } from 'k6/metrics';
import { sleep } from "k6";

export const options = {
    scenarios: {
        k6_demo: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            stages: [
                // Level at 10 iters/s for 10 seconds
                { target: 10, duration: "10s" },
                // Spike from 10 iters/s to 150 iters/s in 5 seconds!
                { target: 150, duration: "5s" },
                // Level at 150 iters/s for 10 seconds
                { target: 150, duration: "10s" },
                // Slowing down from 150 iters/s to 100 iters/s over 20 seconds
                { target: 100, duration: "20s" },
                // Leveled off at 30 iters/s for remainder
                { target: 80, duration: "10s" },
            ],
            preAllocatedVUs: 5,
            maxVUs: 50,
        },
    },
}
tags: {
      test_name: 'TQSV-Dashboard'
  },
  summaryTrendStats: ["min", "max", "avg","med", "p(90)", "p(95)","p(99)", "count"],
};

let requestTrend1 = new Trend('Request1')
let requestTrend2 = new Trend('Request2')

export function contacts() {
  let resp;
  resp=http.get('https://test.k6.io/contacts.php', {
    tags: { custom_tag: 'contacts' },
  });
  requestTrend1.add(resp.timings.duration)
}

export function news() {
  let resp;
  resp=http.get('https://test.k6.io/news.php', {
    tags: { custom_tag: 'news' } ,
  });
  requestTrend2.add(resp.timings.duration)
}

export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
export default function () {
    http.get('https://test.k6.io/');
    sleep(0.25);
}
