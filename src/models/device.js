import mongoose from "mongoose";

// TODO: ownerID might be redundant here, since I plan on storing
// device IDs in an 'owns' or 'writes' array for each user

// TODO: Change to add a 'lastPayload' field that is an object that includes
// a data point (mixed type) and a timestamp it was saved
// It should also include an 'expires' timestamp using timeout, created by the server?

// TODO: Change to add a 'timeout' field that is used to give every
// timestamp an expiration date, when the device is considered offline
// if we pass the expiration date without receiving new data
// Use zeit/ms to do this? idk.

const deviceSchema = mongoose.Schema({
  name: { type: String, required: true },
  // Format is zeit/ms (https://www.npmjs.com/package/ms) ex: '1s', '3s', '5s', ...
  timeout: { type: Number, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  lastPayload: { type: Object },
  // use doc.markModified('lastPayloadTimestamp') if modifying this
  lastPayloadTimestamp: { type: Date }
});

export default mongoose.model("Device", deviceSchema);
