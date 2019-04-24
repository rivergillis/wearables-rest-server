// TODO: convert this to a custom error?
export const newErrorWithStatus = (msg, status) => {
  const err = new Error(msg);
  err.status = status || 500;
  return err;
};

// Determines if an array of mongo object Ids contains the object ID referenced by objectIdString
export const mongoArrayIncludesObjectId = (mongoArray, objectIdString) => {
  return mongoArray.some(readerObj => readerObj.toString() === objectIdString);
};

const roundValue = (value, roundAmt) => {
  return Math.round(value / roundAmt) * roundAmt;
};

// Add fuzz to data value
const fuzzValue = (value, fuzzAmt) => {
  return value + fuzzAmt;
};

// User specified manipulations to Payload data
// restricts reader's view of data
const getRestrictedValue = (value, restriction) => {
  const { roundToNearest, fuzz, dataBlock } = restriction;

  if (roundToNearest !== undefined) {
    value = roundValue(value, roundToNearest);
  }

  if (fuzz !== undefined) {
    value = fuzzValue(value, fuzz);
  }

  if (dataBlock == 'true') {
    value = "--DATA BLOCKED--";
  }

  return value;
};

// determine if timeframe meets START of daily property restriction
// if within restricted timeframe return true, else return false
const timeFrameBegin = timeBegin => {
  let now = new Date();
  let restriction = new Date(timeBegin);

  // now.getTimezoneOffset() returns the time zone difference (in minutes) from current locale to UTC
  // divide by 60 for hours difference
  // add to restriction hours to accurately scale to user indicated START time
  if (now.getHours() < (restriction.getHours() + (now.getTimezoneOffset() / 60))) {
    return false;
  } else if (now.getHours() == (restriction.getHours() + (now.getTimezoneOffset() / 60))) {
    if (now.getMinutes() < restriction.getMinutes()) {
      return false;
    } else if (now.getMinutes() == restriction.getMinutes()) {
      if (now.getSeconds() < restriction.getSeconds()) {
        return false;
      }
    }
  }
  return true;
};

// determine if timeframe meets END of daily property restriction
// if within restricted timeframe return true, else return false
const timeFrameEnd = timeEnd => {
  let now = new Date();
  let restriction = new Date(timeEnd);

  // now.getTimezoneOffset() returns the time zone difference (in minutes) from current locale to UTC
  // divide by 60 for hours difference
  // add to restriction hours to accurately scale to user indicated END time
  if (now.getHours() > (restriction.getHours() + (now.getTimezoneOffset() / 60))) {
    return false;
  } else if (now.getHours() == (restriction.getHours() + (now.getTimezoneOffset() / 60))) {
    if (now.getMinutes() > restriction.getMinutes()) {
      return false;
    } else if (now.getMinutes() == restriction.getMinutes()) {
      if (now.getSeconds() > restriction.getSeconds()) {
        return false;
      }
    }
  }
  return true;
};

// determine if today matches weekDay restriction
// if today is restricted return true, else return false
const checkDay = weekDays => {
  let now = new Date();
  let match = false;

  // cycle through every day in weekDay array
  weekDays.forEach(day => {
    if (now.getDay() == day) {
      match = true;
    }
  });

  return match;
};

// check that data value falls within user's threshold restrictions 
const checkThresholds = (value, thresholdHigh, thresholdLow) => {

  if (thresholdHigh !== undefined) {
    // thresholdHigh exists
    if (value < thresholdHigh) {
      // value meets HIGH restriction
      if (thresholdLow !== undefined) {
        // thresholdLow exists
        if (value > thresholdLow) {
          // value meets LOW restriction
          return true;
        }
      } else {
        // thresholdLow NOT specified
        return true;
      }
    }
  } else if (thresholdLow !== undefined && value > thresholdLow) {
    // thresholdLow exists and value is within restriction
    return true;
  }

  // threshold values NOT MET || do NOT EXIST
  return false;
};

// check that time NOW falls within user's time restrictions
const checkTime = (timeBegin, timeEnd) => {
  if (timeBegin !== undefined) {
    // timeBegin exists
    if (timeFrameBegin(timeBegin)) {
      // time NOW meets timeBegin restriction
      if (timeEnd !== undefined) {
        // timeEnd exists
        if (timeFrameEnd(timeEnd)) {
          // time NOW meets timeBegin && timeEnd restrictions
          return true;
        }
      } else {
        // timeEnd not specified
        return true;
      }
    }
  } else if (timeEnd !== undefined && timeFrameEnd(timeEnd)) {
    // timeEnd exists && value is within restriction
    return true;
  }

  // time values NOT MET || do NOT EXIST
  return false;
};

// List of Restriction Variables for each 'property':
//
// thresholdHigh:
// thresholdLow:
// roundToNearest:
// fuzz:
// dataBlock: (boolean)
// weekDays:  (int array, values 0 - 6)
// timeBegin: (long int, number ms from midnight)
// timeEnd: (long int, number ms from midnight)
//
export const getRestrictedPayload = (
  device,
  readerRestrictions,
  readerEmail
) => {
  const { lastPayload } = device;

  if (readerRestrictions && readerRestrictions[readerEmail]) {
    const restrictionList = readerRestrictions[readerEmail];
    let propertiesToCheck = Object.keys(lastPayload);

    const restrictedPayload = { ...lastPayload };

    // Check each restriction in the list to see if it applies to our payload
    restrictionList.forEach(restriction => {
      const {
        property,
        thresholdHigh,
        thresholdLow,
        timeBegin,
        timeEnd,
        weekDays
      } = restriction;
      const thresholdHighExists = thresholdHigh !== undefined;
      const thresholdLowExists = thresholdLow !== undefined;
      const timeBeginExists = timeBegin !== undefined;
      const timeEndExists = timeEnd !== undefined;
      const weekDaysExists = weekDays !== undefined;

      // If a property explicitly mentioned in the restriction, use that as the only property to check.
      if (property) {
        propertiesToCheck = [property];
      }
      // Check each of the tagged properties against the restriction terms
      propertiesToCheck.forEach(prop => {
        const value = lastPayload[prop].value;

        // check user specified requirements
        // account for nested dependencies
        if (weekDaysExists) {
          // weekday restrictions exists
          if (checkDay(weekDays)) {
            // weekday restrictions met
            if (timeBeginExists || timeEndExists) {
              // time restrictions exist
              if (checkTime(timeBegin, timeEnd)) {
                // time restrictions met
                if (thresholdHighExists || thresholdLowExists) {
                  // threshold restrictions exits
                  if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                    // weekday, time, & threshold restrictions met
                    // alter payload
                    restrictedPayload[prop].value = getRestrictedValue(
                      value,
                      restriction
                    );
                  }
                } else {
                  // no threshold restrictions exist
                  // weekday & time restrictions met
                  // alter payload
                  restrictedPayload[prop].value = getRestrictedValue(
                    value,
                    restriction
                  );
                }
              }
            } else if (thresholdHighExists || thresholdLowExists) {
              // time restrictions do NOT exist
              // threshold restrictions exist
              if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                // weekday & threshold restrictions met
                // alter payload
                restrictedPayload[prop].value = getRestrictedValue(
                  value,
                  restriction
                );
              }
            } else {
              // time & threshold restrictions do NOT exist
              // weekday restrictions met
              // alter payload
              restrictedPayload[prop].value = getRestrictedValue(
                value,
                restriction
              );
            }
          }
        } else if (timeBeginExists || timeEndExists) {
          // weekday restrictions do NOT exist
          // time restrictions exist
          if (checkTime(timeBegin, timeEnd)) {
            // time restrictions met
            if (thresholdHighExists || thresholdLowExists) {
              // threshold restrictions exist
              if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                // time & threshold restrictions met
                // alter payload
                restrictedPayload[prop].value = getRestrictedValue(
                  value,
                  restriction
                );
              }
            } else {
              // threshold restrictions do NOT exist
              // time restrictions met
              // alter payload
              restrictedPayload[prop].value = getRestrictedValue(
                value,
                restriction
              );
            }
          }
        } else if (thresholdHighExists || thresholdLowExists) {
          // weekday & time restrictions do NOT exist
          // threshold restrictions exist
          if (checkThresholds(value, thresholdHigh, thresholdLow)) {
            // threshold restrictions met
            // alter payload
            restrictedPayload[prop].value = getRestrictedValue(
              value,
              restriction
            );
          }
        }
      });
    });

    return restrictedPayload;
  }

  return lastPayload;
};
