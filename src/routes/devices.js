import express from "express";

import checkAuth from "../middleware/check-auth";
import * as DevicesController from "../controllers/devices";

const router = express.Router();

// GET /devices/
// HEADER: bearer auth
// BODY: type (str -> options: 'owner', 'admin')
// Returns a list of every device
router.get("/", checkAuth, DevicesController.get_all_devices);

// POST /users/ with a Device
// HEADER: bearer auth
// BODY: name (str), timeout (str of zeit/ms format https://www.npmjs.com/package/ms)
// Creates a new device listing
router.post("/", checkAuth, DevicesController.create_new_device);

export default router;
