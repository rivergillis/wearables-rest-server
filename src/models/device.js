import mongoose from "mongoose";

// TODO: store 'readers' and 'writers' arrays of userIds,
// then query using https://stackoverflow.com/questions/18148166/find-document-with-array-that-contains-a-specific-value

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
  lastPayloadTimestamp: { type: Date },
  readers: { type: [String] },
  readerRestrictions: { type: Object }
});

export default mongoose.model("Device", deviceSchema);
