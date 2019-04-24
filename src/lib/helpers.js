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
// if within restricted timeframe return true else return false
const timeFrameBegin = timeBegin => {
  let now = new Date();
  // 18:00:00 (HH:MM:SS) offset to scale user set time 
  let restriction = new Date(timeBegin - 64800000);

  if (now.getHours() < restriction.getHours()) {
    return false;
  } else if (now.getHours() == restriction.getHours()) {
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
// if within restricted timeframe return true else return false
const timeFrameEnd = timeEnd => {
  let now = new Date();
  // 18:00:00 (HH:MM:SS) offset to scale user set time 
  let restriction = new Date(timeEnd - 64800000);

  if (now.getHours() > restriction.getHours()) {
    return false;
  } else if (now.getHours() == restriction.getHours()) {
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

const checkDay = weekDays => {
  let now = new Date();
  let match = false;

  weekDays.forEach(day => {
    if (now.getDay() == day) {
      match = true;
    }
  });

  return match;
};

const checkThresholds = (value, thresholdHigh, thresholdLow) => {
  ///// if thresholdHigh exists /////
  if (thresholdHigh !== undefined) {
    // if value is within restriction
    if (value < thresholdHigh) {
      // if thresholdLow exists
      if (thresholdLow !== undefined) {
        // if value is within restriction
        if (value > thresholdLow) {
          // restrict property value
          return true;
        }
      } else {
        // if theresholdHigh is met and there is no thresholdLow restrict property value
        return true;
      }
    }
  } else if (thresholdLow !== undefined && value > thresholdLow) {
    // if thresholdLow exists and value is within restriction
    return true;
  }

  return false;
};

const checkTime = (value, timeBegin, timeEnd) => {
  ///// if timeBegin exists /////
  if (timeBegin !== undefined) {
    // if value is within restriction
    if (timeFrameBegin(timeBegin)) {
      // if timeEnd exists
      if (timeEnd !== undefined) {
        // if value is within restriction
        if (timeFrameEnd(timeEnd)) {
          // restrict property value
          return true;
        }
      } else {
        // if timeBegin is met and there is no timeEnd restrict property value
        return true;
      }
    }
  } else if (timeEnd !== undefined && timeFrameEnd(timeEnd)) {
    // if timeEnd exists and value is within restriction
    return true;
  }

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
        let restrict = false;

        if (thresholdHighExists || thresholdLowExists) {
          if (checkThresholds(value, thresholdHigh, thresholdLow)) {
            restrict = true;
          } else {
            restrict = false;
          }
        }

        if (timeBeginExists || timeEndExists) {
          if (checkTime(value, timeBegin, timeEnd)) {
            if (thresholdHighExists || thresholdLowExists) {
              if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                restrict = true;
              } else {
                restrict = false;
              }
            } else {
              restrict = true;
            }
          } else {
            restrict = false;
          }
        }

        if (weekDaysExists) {
          if (checkDay(weekDays)) {
            if (timeBeginExists || timeEndExists) {
              if (checkTime(value, timeBegin, timeEnd)) {
                if (thresholdHighExists || thresholdLowExists) {
                  if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                    restrict = true;
                  } else {
                    restrict = false;
                  }
                } else {
                  restrict = true;
                }
              } else {
                restrict = false;
              }
            } else if (thresholdHighExists || thresholdLowExists) {
              if (checkThresholds(value, thresholdHigh, thresholdLow)) {
                restrict = true;
              } else {
                restrict = false;
              }
            } else {
              restrict = true;
            }
          } else {
            restrict = false;
          }
        }

        if (restrict) {
          // if all existing restrictions are met
          // alter payload
          restrictedPayload[prop].value = getRestrictedValue(
            value,
            restriction
          );
        }
      });
    });

    return restrictedPayload;
  }

  return lastPayload;
};
