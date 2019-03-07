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
