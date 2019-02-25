import express from "express";

import checkAuth from "../middleware/check-auth";
import * as DevicesController from "../controllers/devices";

const router = express.Router();

// GET /devices/
// Returns a list of every device
router.get("/", DevicesController.get_all_devices);

// POST /users/ with a Device
// BODY: name
// Creates a new device listing
router.post("/", DevicesController.create_new_device);

export default router;
