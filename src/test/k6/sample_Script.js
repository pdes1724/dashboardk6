import http from 'k6/http';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { scenario } from 'k6/execution';
import { check } from 'k6';
import * as CONFIG from './config.js'


/*const testvar = __ENV.K6_DURATION;
console.log("testvar is", testvar);*/

export const options = {
  discardResponseBodies: true,
  scenarios: {
    login: {
          executor: 'constant-arrival-rate',
          exec: 'login',
          duration: CONFIG.HOLD_DURATION,
          rate: 5,
          preAllocatedVUs: 5,
          timeUnit: "1s",
    },
    contacts: {
      executor: 'constant-arrival-rate',
      exec: 'contacts',
      duration: CONFIG.HOLD_DURATION,
      rate: 3,
      preAllocatedVUs: 3,
      timeUnit: "1s",
    },
    news: {
      executor: 'constant-arrival-rate',
      exec: 'news',
      duration: CONFIG.HOLD_DURATION,
      rate: 4,
      preAllocatedVUs: 4,
      timeUnit: "1s",
    },
  },
 /* tags: {
      test_name: 'TQSV-QPerf'
  },*/
  summaryTrendStats: ["min", "max", "avg","med", "p(90)", "p(95)","p(99)", "count"],
};

let requestTrend1 = new Trend('Request1')
let requestTrend2 = new Trend('Request2')

const csvData = new SharedArray('another data name', function () {
  // Load CSV file and parse it using Papa Parse
  return papaparse.parse(open('./data.csv'), { header: true }).data;
});

export function login () {

  const randomUser = csvData[Math.floor(Math.random() * csvData.length)];
  const uniqueUser = csvData[scenario.iterationInTest];
  //console.log('Random user: ', JSON.stringify(randomUser));

  const params = {
    login: randomUser.username,
    password: randomUser.password,
    redir: '1',
    csrftoken: 'NzQ4NDY0OTc5',
  };

  const res1 = http.post('https://test.k6.io/login.php', params);
  check(res1, {
    'login succeeded': (r) => r.status === 200 && r.body.indexOf('successfully authorized') !== -1,
  });

}

export function contacts() {
  //let resp;
  const resp=http.get('https://test.k6.io/contacts.php');
  requestTrend1.add(resp.timings.duration)

  check(resp, {
        'is status 200': (r) => r.status === 200,
        'is status 400': (r) => r.status === 500,
        //'body size is 11,105 bytes': (r) => r.body.length == 11105,
        //'is status 400': (r) => r.status === 400,
   });
}

export function news() {
  let resp;
  resp=http.get('https://test.k6.io/news.php');
  requestTrend2.add(resp.timings.duration)
}

export function handleSummary(data) {
  return {
    //'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}