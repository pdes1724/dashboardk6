/**
 * Generates a consolidated options object for provided k6 test files that can be used in a `main.js` file.
 * @param {Array} testsArray array of imported test files in main.js
 * @param {boolean} discardResponseBodies whether to discard response bodies (`true` is recommended & default)
 * @returns {object} the consolidated options object
 */
export const getConsolidatedOptions = (testsArray, discardResponseBodies) => {
  const scenarioCollection = {};
  const thresholdsCollection = {};

  for (const test of testsArray) {
    Object.entries(test.options.scenarios).forEach((item) => (scenarioCollection[item[0]] = item[1]));
    Object.entries(test.options.thresholds).forEach(
      (item) => (thresholdsCollection[item[0]] = item[1]),
    );
  }

  return {
    scenarios: scenarioCollection,
    discardResponseBodies: discardResponseBodies != undefined ? discardResponseBodies : false,
    userAgent: 'k6',
    thresholds: thresholdsCollection,
    summaryTrendStats: ['avg', 'min', 'max', 'p(90)', 'p(95)', 'p(99)'],
    // ["avg","min","med","max","p(90)","p(95)"]
    systemTags: ['scenario'],
  };
};
