import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ms from "ms";

import Device from "../models/device";
import User from "../models/user";
import { newErrorWithStatus, getRestrictedPayload } from "../lib/helpers";

// Returns every device that the user has access to for the given query type.
// Readers will be restricted on every device that they have restrictions for.
export const get_all_devices = async (req, res, next) => {
  try {
    let docs = null;
    if (req.query.type === "owner") {
      // Return everything owned if owner
      docs = await Device.find({ ownerId: req.userData.userId })
        .select("-__v")
        .exec();
    } else if (req.query.type === "admin") {
      // Return everything if admin with correct key
      if (req.query.adminKey != process.env.ADMIN_KEY) {
        throw newErrorWithStatus("Invalid admin key", 401);
      }
      docs = await Device.find()
        .select("-__v")
        .exec();
    } else if (
      req.query.type === "read" ||
      req.query.type === "reader" ||
      req.query.type === undefined
    ) {
      // Grab what we can reader, remove the readers list and owner id.
      docs = await Device.find({ readers: req.userData.email })
        .select("-__v -readers -ownerId")
        .exec();
      // Now replace the payloads for any payloads where the current user's
      // email is listed in the reader restrictions
      const newDocs = docs.map(device => {
        // This will automatically determine if we need to restrict based on the email
        const obj = device.toObject();
        obj.lastPayload = getRestrictedPayload(
          obj,
          obj.readerRestrictions,
          req.userData.email
        );

        // Don't let the user see this
        delete obj.readerRestrictions;
        return obj;
      });
      // Now return the restricted documents
      const response = { count: docs.length, devices: newDocs };
      return res.status(200).json(response);
    } else {
      throw newErrorWithStatus("Invalid type property");
    }
    const response = { count: docs.length, devices: docs };
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
};

// Create a new device, returns the device (which includes the deviceId).
// The creator becomes the device owner.
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

// Returns the data for a single device. Owners receive all data,
// Readers will receive whatever is not restricted.
export const get_device_data = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    if (req.query.adminKey === process.env.ADMIN_KEY) {
      // Can read all if admin
      return res.status(200).json({ device });
    } else if (device.ownerId.toString() === req.userData.userId) {
      // Can read all if owner
      return res.status(200).json({ device });
    } else if (device.readers.includes(req.userData.email)) {
      // TODO: use readerRestrictions[userEmail] to alter lastPayload (for a copy)...
      // Can read some if reader
      const {
        readers,
        ownerId,
        readerRestrictions,
        ...restOfDevice
      } = device.toObject();
      const resultDevice = {
        ...restOfDevice,
        lastPayload: getRestrictedPayload(
          restOfDevice,
          readerRestrictions,
          req.userData.email
        )
      };
      return res.status(200).json({ device: resultDevice });
    }
    throw newErrorWithStatus("Unauthorized user", 401);
  } catch (err) {
    return next(err);
  }
};

// Send a payload to a device. Done by the device's owner.
// Attaches a timestamp to the payload automatically.
export const device_send_data = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    if (device.ownerId.toString() != req.userData.userId) {
      throw newErrorWithStatus("Not authorized to write to device", 401);
    }

    device.lastPayload = req.body.payload;
    device.lastPayloadTimestamp = new Date();
    device.markModified("lastPayloadTimestamp"); // required for dates
    device.markModified("lastPayload");
    await device.save();

    res.status(200).json({ message: "Device updated", device });
  } catch (err) {
    return next(err);
  }
};

// Adds a reader to the readers list for a device.
// Can be done by the device owner. The reader must exist.
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

// Adds a new reader restriction to a device. Can be done by the owner of the device.
export const device_add_reader_restriction = async (req, res, next) => {
  try {
    // Find the object and make sure we're the owner
    const device = await Device.findById(req.params.deviceId)
      .select("-__v")
      .exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    if (req.userData.userId != device.ownerId) {
      throw newErrorWithStatus("Cannot write to device", 401);
    }

    // Try to find the user that we want to restrict
    const user = await User.findOne({ email: req.body.readerEmail }).exec();
    if (!user) {
      throw newErrorWithStatus(
        `User not found for email ${req.body.readerEmail}`,
        404
      );
    }

    // Create the root restrictions obj if it doesn't already exist, then add the restriction.
    if (!device.readerRestrictions) {
      device.readerRestrictions = {};
    }
    // Key for the object is the readers email. Ensures easy access later.
    device.readerRestrictions[req.body.readerEmail] = req.body.restriction;
    device.markModified("readerRestrictions");
    await device.save();

    res.status(201).json({ message: "Restriction added to device", device });
  } catch (err) {
    return next(err);
  }
};

// Delete a device. Can be done if owner or admin.
export const delete_device = async (req, res, next) => {
  try {
    // Delete if admin
    if (req.body.adminKey === process.env.ADMIN_KEY) {
      await Device.deleteOne({ _id: req.params.deviceId }).exec();
      return res.status(200).json({ message: "device deleted" });
    }

    // Otherwise find the device and delete if owner
    const device = await Device.findById(req.params.deviceId).exec();
    if (!device) {
      throw newErrorWithStatus("Device not found", 404);
    }
    if (req.userData.userId != device.ownerId) {
      throw newErrorWithStatus("Cannot delete device", 401);
    }

    await Device.deleteOne({ _id: req.params.deviceId }).exec();
    return res.status(200).json({ message: "device deleted" });
  } catch (err) {
    next(err);
  }
};
