import express from "express";

import checkAuth from "../middleware/check-auth";
import * as DevicesController from "../controllers/devices";

const router = express.Router();

// GET /devices/
// HEADER: bearer auth
// BODY: type (str -> options: 'owner', 'admin')
// Returns a list of every device
router.get("/", checkAuth, DevicesController.get_all_devices);

// POST /devices/ with a Device
// HEADER: bearer auth
// BODY: name (str), timeout (str of zeit/ms format https://www.npmjs.com/package/ms)
// Creates a new device listing
router.post("/", checkAuth, DevicesController.create_new_device);

// GET /devices/:deviceId
// HEADER: bearer auth
// Returns the information the user has access to on this device
router.get("/:deviceId", checkAuth, DevicesController.get_device_data);

// POST /devices/:deviceId with a payload
// HEADER: bearer auth
// BODY: payload (json obj or single value)
// Updates the device payload
router.post("/:deviceId", checkAuth, DevicesController.device_send_data);

router.post(
  "/:deviceId/readers",
  checkAuth,
  DevicesController.device_add_reader
);

// DELETE /devices/:deviceId
// HEADER: bearer auth
// Deletes a device with the given ID.
// TODO: Protect this somehow, use an admin key?
router.delete("/:deviceId", checkAuth, DevicesController.delete_device);

export default router;
