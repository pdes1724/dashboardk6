const { ConfigHelper } = require('../lib/configHelper.js');

// Durations in seconds
export const RAMP_UP = __ENV.RAMP_UP ? __ENV.RAMP_UP : 0;
export const HOLD_DURATION = __ENV.HOLD_DURATION ? __ENV.HOLD_DURATION : 10;
export const TEAR_DOWN = __ENV.TEAR_DOWN ? __ENV.TEAR_DOWN : 0;

// Environment specific
export const BASE_URL = __ENV.BASE_URL ? __ENV.BASE_URL : 'http://perf.pdis-np.us-east-1.aws.sysco.net:8081';
export const TOKEN_URL = "https://api-gateway-perf.sysco.com/token";

// SLA
export const SLA_90PCT_RESPONSE_TIME = 1000;
export const SLA_ERROR_RATE = 0.001;
export const THROUGHPUT_TOLERANCE_PCT = 0.90;

// GA Load percentage
// Eg: 1 for 100% GA, 0.5 for 50% GA and likewise
export const TARGET_LOAD = __ENV.TARGET_LOAD ? __ENV.TARGET_LOAD : 1;

// 100% GA load (TPS)
const GA_TPS_GET_CUSTOMER = 20.6;
const GA_TPS_POST_CUSTOMERS = 16.47;

// Converted load for the test
// Call getConvertedLoad(GA_TPS, TPS_TU) to define converted load
export const configHelper = new ConfigHelper(TARGET_LOAD, RAMP_UP, HOLD_DURATION, THROUGHPUT_TOLERANCE_PCT);
export const GET_CUSTOMER = configHelper.getPerfObject(GA_TPS_GET_CUSTOMER);
export const POST_CUSTOMERS = configHelper.getPerfObject(GA_TPS_POST_CUSTOMERS);
