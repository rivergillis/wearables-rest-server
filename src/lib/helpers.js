// TODO: conver this to a custom error?
export const newErrorWithStatus = (msg, status) => {
  const err = new Error(msg);
  err.status = status || 500;
  return err;
};
