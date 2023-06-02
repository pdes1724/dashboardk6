import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { Trend } from 'k6/metrics';
import { check } from 'k6';

export const options = {
  discardResponseBodies: true,
  scenarios: {
    contacts: {
      executor: 'constant-arrival-rate',
      exec: 'contacts',
      duration: '2m',
      rate: 30,
      preAllocatedVUs: 30,
      timeUnit: "1s",
    },
    news: {
      executor: 'constant-arrival-rate',
      exec: 'news',
      duration: '2m',
      rate: 20,
      preAllocatedVUs: 20,
      timeUnit: "1s",
    },
  },
  summaryTrendStats: ["min", "max", "avg","med", "p(90)", "p(95)","p(99)", "count"],
};

//let requestTrend1 = new Trend('Request1')
//let requestTrend2 = new Trend('Request2')

export function contacts() {
const res = http.get('http://test.kdd86.io/');
   check(res, {
      'is status 200': (r) => r.status === 200,
      'is status 400': (r) => r.status === 400,
      //'body size is 11,105 bytes': (r) => r.body.length == 11105,
      //'is status 400': (r) => r.status === 400,
    });
     //tags: { custom_tag: 'contacts' },
     //requestTrend1.add(res.timings.duration)
}

export function news() {
  const res = http.get('http://test.kdd346.io/');

     check(res, {
        'is status 200': (r) => r.status === 200,
        //'body size is 11,105 bytes': (r) => r.body.length == 11105,
        'is status 400': (r) => r.status === 400,
      });
  //tags: { custom_tag: 'news' } ,
  //requestTrend2.add(res.timings.duration)
}




export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
