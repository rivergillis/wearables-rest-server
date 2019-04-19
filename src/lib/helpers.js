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
  const { roundToNearest, fuzz } = restriction;

  if (roundToNearest !== undefined) {
    value = roundValue(value, roundToNearest);
  }

  if (fuzz !== undefined) {
    value = fuzzValue(value, fuzz);
  }

  return value;
};

// determine if timeframe meets START of daily property restriction
// if within restricted timeframe return true else return false
const timeFrameBegin = timeBegin => {
  let now = new Date();
  let restriction = new Date(timeBegin);

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
  let restriction = new Date(timeEnd);

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

  weekDays.forEach(day => {
    if (now.getDay() == day) return true;
  });
  return false;
};

// List of Restriction Variables for each 'property':
//
// thresholdHigh:
// thresholdLow:
// roundToNearest:
// fuzz:
// weekDays:  (int, array of values 0 - 6)
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
        let grantAccess = true; // keeps track that all requirements are met

        ///// for Max/Min threshold restrictions /////
        if (thresholdHighExists && value >= thresholdHigh) {
          // if thresholdHigh exists and value is outside permissions
          grantAccess = false;
        }
        if (thresholdLowExists && value <= thresholdLow) {
          // if thresholdLow exists and value is outside permissions
          grantAccess = false;
        }

        ///// for checkIn restrictions /////
        if (weekDaysExists && !checkDay(weekDays)) {
          grantAccess = false;
        }

        ///// for timeBegin/timeEnd restrictions /////
        if (timeBeginExists && !timeFrameBegin(timeBegin)) {
          grantAccess = false;
        }
        if (timeEndExists && !timeFrameEnd(timeEnd)) {
          grantAccess = false;
        }

        // If we need to alter the payload, do so
        if (!grantAccess) {
          restrictedPayload[prop].value = getRestrictedValue(
            value,
            restriction
          );
        }
        return;
      });
    });

    return restrictedPayload;
  }

  return lastPayload;
};
