export const K6Helper = class {
  constructor(CONFIG) {
    this.rampUpTime = CONFIG.RAMP_UP;
    this.holdDuration = CONFIG.HOLD_DURATION;
  }

  /**
   * This method can be used to find out if current time is within test hold duration
   * @param {Date} testStartTime test start time
   * @returns true if invoked during test hold duration, false otherwise
   */
  isWithinHoldDuration(testStartTime) {
    const currentDuration = Date.now() - testStartTime;
    return currentDuration >= this.rampUpTime * 1000 && currentDuration < (this.rampUpTime + this.holdDuration) * 1000;
  }

  /**
   * This method will update the thresholds
   * @param {Date} testStartTime test start time
   * @param {Object} response k6 response object
   * @param {boolean} resSuccess Success status of the request
   * @param {Trend} tLatency Threshold object for Latency
   * @param {Counter} tReqCount Threshold object for Request Count
   * @param {Rate | null} tFailureRate Threshold object for Failure Rate
   */
  updateThresholds(testStartTime, response, resSuccess, tLatency, tReqCount, tFailureRate) {
    if (tFailureRate) {
      tFailureRate.add(!resSuccess);
    }

    if (resSuccess) {
      tLatency.add(response.timings.duration);
    }

    if (this.isWithinHoldDuration(testStartTime)) {
      tReqCount.add(1);
    }
  }
};
