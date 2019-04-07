// TODO: conver this to a custom error?
export const newErrorWithStatus = (msg, status) => {
  const err = new Error(msg);
  err.status = status || 500;
  return err;
};

// Determines if an array of mongo object Ids contains the object ID referenced by objectIdString
export const mongoArrayIncludesObjectId = (mongoArray, objectIdString) => {
  return mongoArray.some(readerObj => readerObj.toString() === objectIdString);
};

const roundToNearest = (value, roundAmt) => {
  return Math.round(value / roundAmt) * roundAmt;
};

export const getRestrictedPayload = (
  device,
  readerRestrictions,
  readerEmail
) => {
  const { lastPayload } = device;

  if (readerRestrictions && readerRestrictions[readerEmail]) {
    const restrictionList = readerRestrictions[readerEmail];
    let propertiesToCheck = Object.keys(lastPayload);
    // Check each restriction in the list to see if it applies to our payload
    restrictionList.forEach(restriction => {
      console.log(restriction);
      const { property, thresholdHigh, thresholdLow } = restriction;
      const thresholdHighExists = thresholdHigh !== undefined;
      const thresholdLowExists = thresholdLow !== undefined;

      // If a property explicitly mentioned in the restriction, use that as the only property to check.
      if (property) {
        propertiesToCheck = [property];
      }
      // Check each of the tagged properties against the restriction terms
      propertiesToCheck.forEach(prop => {
        const value = lastPayload[prop].value;
        console.log(`prop: ${prop} val: ${value}`);
        if (thresholdHighExists && value <= thresholdHigh) {
          // Max threshold specified and we meet it
          if (thresholdLowExists && value >= thresholdLow) {
            // Max and min threshold specified and we meet them both
            console.log("conditions met!");
            return;
          } else if (!thresholdLowExists) {
            // Max threshold met and min not specified
            console.log("conditions met!");
            return;
          } else {
            // Max threshold met, but we're below the min threshold
            console.log("conditions not met!");
            return;
          }
        } else if (thresholdLowExists && value >= thresholdLow) {
          if (thresholdHighExists) {
            // Meets min threshold but not max threshold
            console.log("conditions not met!");
            return;
          } else {
            // Meets min threshold and no max specified
            console.log("conditions met!");
            return;
          }
        } else if (!thresholdHighExists && !thresholdLowExists) {
          // Threshold not specified, always applies
          console.log("conditions met!");
          return;
        } else {
          // Meets neither threshold
          console.log("conditions not met!");
          return;
        }
      });
    });
    return 2;
  }

  return lastPayload;
};
