import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ms from "ms";

import Device from "../models/device";
import User from "../models/user";
import { newErrorWithStatus } from "../lib/helpers";

export const get_all_devices = async (req, res, next) => {
  try {
    let docs = null;
    if (req.body.type === "owner") {
      docs = await Device.find({ ownerId: req.userData.userId })
        .select("-__v")
        .exec();
    } else if (req.body.type === "admin") {
      if (req.body.adminKey != process.env.ADMIN_KEY) {
        throw newErrorWithStatus("Invalid admin key", 401);
      }
      docs = await Device.find()
        .select("-__v")
        .exec();
    } else if (
      req.body.type === "read" ||
      req.body.type === "reader" ||
      req.body.type === undefined
    ) {
      docs = await Device.find({ readers: req.userData.email })
        .select("-__v -readers -ownerId")
        .exec();
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
    // If the user passes us a time in ms, use that, otherwise convert using zeit/ms
    const timeoutCast = Number(req.body.timeout);

    const device = new Device({
      name: req.body.name,
      timeout: isNaN(timeoutCast) ? ms(req.body.timeout) : timeoutCast,
      ownerId: new mongoose.Types.ObjectId(req.userData.userId)
    });
    const result = await device.save();

    // TODO: alter the user to add result._id to their 'writes' list?
    res.status(201).json({ message: "Device created", device: result });
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
  // TODO: Make sure user is owner
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    device.lastPayload = req.body.payload;
    device.lastPayloadTimestamp = new Date();
    device.markModified("lastPayloadTimestamp"); // required for dates
    await device.save();

    res.status(200).json({ message: "Device updated", device });
  } catch (err) {
    return next(err);
  }
};

export const device_add_reader = async (req, res, next) => {
  // TODO: Make this atomic by using Device.update() https://stackoverflow.com/questions/33049707/push-items-into-mongo-array-via-mongoose
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    if (req.userData.userId != device.ownerId) {
      throw newErrorWithStatus("Cannot write to device", 401);
    }

    // Try to find the user that we want to add as a reader
    const user = await User.findOne({ email: req.body.readerEmail }).exec();
    if (!user) {
      throw newErrorWithStatus(
        `User not found for email ${req.body.readerEmail}`,
        404
      );
    }

    // Enforce uniqueness
    if (!device.readers.includes(req.body.readerEmail)) {
      device.readers.push(req.body.readerEmail);
      await device.save();
    }

    res.status(201).json({ message: "Reader added to device", device });
  } catch (err) {
    return next(err);
  }
};

export const delete_device = async (req, res, next) => {
  try {
    await Device.deleteOne({ _id: req.params.deviceId }).exec();
    return res.status(200).json({ message: "device deleted" });
  } catch (err) {
    next(err);
  }
};
