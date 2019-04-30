import mongoose from "mongoose";

// This is what a Device object should look like.
const deviceSchema = mongoose.Schema({
  name: { type: String, required: true },
  // Format is zeit/ms (https://www.npmjs.com/package/ms) ex: '1s', '3s', '5s', ...
  timeout: { type: Number, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // This ensures it is a valid ObjectId for a User that exists
    required: true
  },
  lastPayload: { type: Object },
  // use doc.markModified('lastPayloadTimestamp') if modifying this
  lastPayloadTimestamp: { type: Date },
  readers: { type: [String] },
  readerRestrictions: { type: Object }
});

export default mongoose.model("Device", deviceSchema);
