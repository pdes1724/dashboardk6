import { check } from 'k6';
import { vu, scenario } from 'k6/execution';
import http from 'k6/http';
import { SharedArray } from 'k6/data';
import * as CONFIG from '../lib/config.js'
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
import { Trend } from 'k6/metrics';


//Init Code
const loadFrequency = parseInt(2 * CONFIG.TARGET_LOAD);
const noVus = parseInt(1 * CONFIG.TARGET_LOAD);

const csvData = new SharedArray('getOpcoProductDetails', () => {
    return papaparse.parse(open('../testdata/Get_Opco_Product_Details_test_data.csv'), { header: true, skipEmptyLines: true }).data;
});

function getAuthToken() {
    let params = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            "Authorization": "Basic TGJ0OGtRMzNjdUFHRlBaQXdld2VpS3ZHMHVXS3B6WEM6QmtUaWVPM0RwRk1HQ0RKcw==",
        }
    };

    let response = http.post(`${CONFIG.TOKEN_URL}`, { "grant_type": "client_credentials" }, params);

    check(response, {
        'GET https://api-gateway-perf.sysco.com/token status was 200': (r) => r.status == 200
    });

    const token = JSON.parse(response.body).access_token;

    return token;
}

export let options = {
    scenarios: {
        getOpcoProductDetailsScenario: {
            executor: 'ramping-arrival-rate',
            exec: 'getOpcoProductDetails',
            startRate: 0,
            timeUnit: '1s',
            gracefulStop: '5s',
            preAllocatedVUs: noVus,
            stages: [
                { target: loadFrequency, duration: `${CONFIG.RAMP_UP}s` },
                { target: loadFrequency, duration: `${CONFIG.HOLD_DURATION}s` },
                { target: 0, duration: `${CONFIG.TEAR_DOWN}s` }
            ],
            tags: {perf_test_name: 'getopcoproductdetailstest'}
        }
    },
    thresholds: {
        'http_req_duration{scenario:getOpcoProductDetailsScenario}': ['p(95)<2000', 'p(99)<2500'],
        'http_reqs{scenario:getOpcoProductDetailsScenario}': ['rate>1'],
    },
};

//Setup code
export const setup = () => {
    return {
        accessToken: getAuthToken()
    }
}

//VU code
export const getOpcoProductDetails = (data) => {
    let params = {
        headers: {
            'Accept': 'application/json',
            'content-type': 'application/json',
            'accept-encoding': 'gzip;q=0,deflate,sdch',
            'Authorization': 'Bearer ' + data.accessToken
        }
    };

    const vuId =  vu.idInInstance;
    const itrNo = vu.iterationInInstance;
    const itrNoGlobal = scenario.iterationInInstance;

    const entryNo = itrNoGlobal % csvData.length;

    const endpoint = `${CONFIG.BASE_URL}/opcos/${csvData[entryNo].opcos}/product/${csvData[entryNo].supcs}?lang=${csvData[entryNo].lang}`;

    let res = http.get(endpoint, params);

    console.log("vu: " + vuId + ", itr: " + itrNo + ", itrGlobal: " + itrNoGlobal + ", response status: " + res.status);

    check(res, {
        'GET /opcos/{id}/products/{supcs} -> status was 200': (r) => r.status == 200
    });
}


export function handleSummary(data) {
  return {
    'k6summary.html': htmlReport(data, { debug: false }),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
