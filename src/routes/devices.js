import express from "express";

import checkAuth from "../middleware/check-auth";
import * as DevicesController from "../controllers/devices";

const router = express.Router();

// GET /devices?type=[type]
// HEADER: bearer auth
// Params: type (str -> options: 'owner', 'admin', 'read')
// Returns a list of every device
// Add an adminKey by accessing GET /devices?type=[type]&adminKey=[adminKey]
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

// POST /devices/:deviceId/readers with a readerEmail
// HEADER: bearer auth
// BODY: readerEmail: string of an email corresponding to a user
// deviceId must be owned by the user being authenticated
// Adds the user to the list of readers for the device
router.post(
  "/:deviceId/readers",
  checkAuth,
  DevicesController.device_add_reader
);

// DELETE /devices/:deviceId
// HEADER: bearer auth
// Deletes a device with the given ID.
router.delete("/:deviceId", checkAuth, DevicesController.delete_device);

export default router;
