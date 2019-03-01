import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ms from "ms";

import Device from "../models/device";
import { newErrorWithStatus } from "../lib/helpers";

export const get_all_devices = async (req, res, next) => {
  try {
    let docs = null;
    if (req.body.type === "owner") {
      docs = await Device.find({ ownerId: req.userData.userId })
        .select("-__v")
        .exec();
    } else if (req.body.type === "admin") {
      // TODO: protect this somehow
      docs = await Device.find()
        .select("-__v")
        .exec();
    } else if (req.body.type == "read") {
      // TODO: Search for devices with read access
      throw new Error("Not yet implemented");
    } else {
      throw newErrorWithStatus("Invalid type property");
    }
    const response = { count: docs.length, devices: docs };
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
};

export const create_new_device = async (req, res, next) => {
  try {
    const device = new Device({
      name: req.body.name,
      timeout: ms(req.body.timeout),
      ownerId: new mongoose.Types.ObjectId(req.userData.userId)
    });
    const result = await device.save();

    // TODO: alter the user to add result._id to their 'writes' list?

    console.log(result);
    res.status(201).json({ message: "Device created" });
  } catch (err) {
    return next(err);
  }
};

export const get_device_data = async (req, res, next) => {
  // TODO: check if the user can get this device's info
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    return res.status(200).json({ device });
  } catch (err) {
    return next(err);
  }
};

export const device_send_data = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    device.lastPayload = req.body.payload;
    device.lastPayloadTimestamp = new Date();
    device.markModified("lastPayloadTimestamp"); // required for dates
    await device.save();

    res.status(200).json({ message: "Device updated", device });
  } catch (err) {
    return next(err);
  }
};
