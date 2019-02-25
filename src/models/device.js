import mongoose from "mongoose";

// TODO: ownerID might be redundant here, since I plan on storing
// device IDs in an 'owns' or 'writes' array for each user

const deviceSchema = mongoose.Schema({
  name: { type: String, required: true }
  // ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

export default mongoose.model("Device", deviceSchema);
