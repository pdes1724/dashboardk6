/* eslint-disable no-param-reassign */
/**
 * This method is used to get the ideal Time Unit (TU) in seconds for the Target GA load
 *
 * Note: Max TU will be 100s
 *
 * @param {number} gaLoadTPS GA throughput (TPS)
 * @param {number} targetLoad Target Load
 * @returns Time Unit (in seconds)
 */
 const getTimeUnit = (gaLoadTPS, targetLoad) => {
  const loadTPS = gaLoadTPS * targetLoad;
  if (Math.floor(loadTPS) !== loadTPS) {
    const decimals = loadTPS.toString().split('.')[1].length;
    if (decimals === 1) {
      return 10;
    }
    return 100;
  }
  return 1;
};

/**
 * This method is used to get the ideal Time Unit (TU) in seconds for the given load (TPS)
 *
 * Note: Max TU will be 1000s
 *
 * @param {number} load throughput (TPS)
 * @returns Time Unit (in seconds)
 */
const getExtendedTimeUnit = (load) => {
  if (Math.floor(load) !== load) {
    const decimals = load.toString().split('.')[1].length;
    if (decimals === 1) {
      return 10;
    } else if (decimals === 2) {
      return 100;
    }
    return 1000;
  }
  return 1;
};

/**
 * This method is used to round the desired throughput to a whole number as expected by k6
 *
 * @param {number} load throughput
 * @param {number} timeUnit Time Unit (in seconds)
 * @returns Rounded throughput for provided load
 */
const getRoundedThroughput = (load, timeUnit) => Math.round(load * timeUnit);

/**
 * This method is used to calculate the desired throughput (TPT) according to below formula
 *
 * TPT = gaLoad * timeUnit * TARGET_LOAD
 *
 * Note: TPT will always be >= 1
 *
 * @param {number} gaLoadTPS GA throughput (TPS)
 * @param {number} timeUnit Time Unit (in seconds)
 * @param {number} targetLoad Target Load
 * @returns Desired throughput for target load (TPT aka Transactions Per TimeUnit)
 */
const getDesiredLoad = (gaLoadTPS, timeUnit, targetLoad) => {
  let convertedLoad = Math.round(gaLoadTPS * timeUnit * targetLoad);
  if (convertedLoad <= 0) {
    convertedLoad = 1;
  }
  return convertedLoad;
};

/**
 * This method is used to calculate the expected request count for the hold duration of the test
 *
 * @param {number} throughput load throughput
 * @param {number} timeUnit throughput time unit in seconds
 * @param {number} holdDuration hold duration of the test, for which the expected request count needs to be found out
 * @param {decimals} tolerancePercentage tolerance percentage (0.9 for 90% of accuracy aka 10% of error tolerance)
 * @returns number of requests that are expected to be sent during the specified hold duration
 */
const getExpectedRequestCount = (throughput, timeUnit, holdDuration, tolerancePercentage) =>
  Math.floor(throughput / timeUnit * holdDuration * tolerancePercentage);

/**
 * This method is used to calculate the expected error rate for the given request count
 *
 * @param {number} requestCount request count in hold duration
 * @returns error rate (in decimals)
 */
export const getExpectedErrorRate = (requestCount) => {
  if (requestCount < 300) {
    return 0.03;
  } else if (requestCount < 1000) {
    return 0.005;
  }
  return 0.001;
};

/**
 * This method is used to get the desired maximum VU count for the test
 *
 * @param {number} maxDurationOfVU estimated max duration of the VU function
 * @param {number} throughputOfVU throughput of the VU function during the test
 * @param {number} timeUnit throughput time unit in seconds
 * @param {number} slownessFactor factor which determines the slowness of the network (optional and the default value is 1)
 * @returns  {number}  Max VU count (Note: The lowest value for 'Max VU Count' would be 10)
 */
export const getExpectedMaxVUCount = (maxDurationOfVU, throughputOfVU, timeUnit, slownessFactor) => {
  slownessFactor = slownessFactor !== undefined ? slownessFactor : 1;
  const expectedMaxVUCount = Math.round(maxDurationOfVU * (throughputOfVU / timeUnit) * slownessFactor / 1000);
  if (expectedMaxVUCount < 10) {
    return 10;
  } else if (expectedMaxVUCount > 1000) {
    console.warn('Max VU count exceeds 1000. Make sure the LG is capable of producing such higher loads!');
  }
  return expectedMaxVUCount;
};

export const ConfigHelper = class {
  constructor(targetLoad, rampUpDuration, holdDuration, throughputTolerance) {
    this.targetLoad = targetLoad;
    this.rampUpDuration = rampUpDuration;
    this.holdDuration = holdDuration;
    this.throughputTolerance = throughputTolerance;
  }

  /**
   * This method will generate a PerfObject to be used in test files
   *
   * @param {number} gaLoadTPS GA throughput (TPS)
   * @returns PerfObject = { throughput: number, timeUnit: number, expectedReqCountInHoldDuration: number, expectedErrorRate: decimal }
   */
  getPerfObject(gaLoadTPS) {
    const tu = getTimeUnit(gaLoadTPS, this.targetLoad);
    const tp = getDesiredLoad(gaLoadTPS, tu, this.targetLoad);
    const rc = getExpectedRequestCount(tp, tu, this.holdDuration, this.throughputTolerance);
    const er = getExpectedErrorRate(rc);
    return {
      throughput: tp,
      timeUnit: tu,
      expectedReqCountInHoldDuration: rc,
      expectedErrorRate: er,
    };
  }

  /**
   * This method will generate a PerfObject to be used in test files when the endpoint appears multiple times per iteration
   *
   * @param {object} perfObject PerfObject from config.js
   * @param {number} requestsPerIteration number of appearances of the endpoint per iteration
   * @returns PerfObject = { throughput: number, timeUnit: number, expectedReqCountInHoldDuration: number, expectedErrorRate: decimal }
   */
  getPerIterationPerfObject(perfObject, requestsPerIteration) {
    const perIterationThroughput = perfObject.throughput / perfObject.timeUnit / requestsPerIteration;
    const tu = getExtendedTimeUnit(perIterationThroughput);
    const tp = getRoundedThroughput(perIterationThroughput, tu);
    const rc = getExpectedRequestCount(tp, tu, this.holdDuration, this.throughputTolerance);
    const er = getExpectedErrorRate(rc);
    return {
      throughput: tp,
      timeUnit: tu,
      expectedReqCountInHoldDuration: rc,
      expectedErrorRate: er,
    };
  }

  /**
   * This method will generate a PerfObject to be used in test files when two VU functions are needed for same endpoint based on a pre-defined ratio
   * (Eg: Pricing v1:v2, Customer:MA, etc.)
   *
   * @param {object} perfObject PerfObject from config.js
   * @param {number} percentage percentage of current varient (Eg: 0.25 for 25%)
   * @returns PerfObject = { throughput: number, timeUnit: number, expectedReqCountInHoldDuration: number, expectedErrorRate: decimal }
   */
  getPercentagePerfObject(perfObject, percentage) {
    const percentageThroughput = perfObject.throughput / perfObject.timeUnit / (1 / percentage);
    const tu = getExtendedTimeUnit(percentageThroughput);
    const tp = getRoundedThroughput(percentageThroughput, tu);
    const rc = getExpectedRequestCount(tp, tu, this.holdDuration, this.throughputTolerance);
    const er = getExpectedErrorRate(rc);
    return {
      throughput: tp,
      timeUnit: tu,
      expectedReqCountInHoldDuration: rc,
      expectedErrorRate: er,
    };
  }
};
