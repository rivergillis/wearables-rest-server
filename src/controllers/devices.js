import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Device from "../models/device";

export const get_all_devices = async (req, res, next) => {
  try {
    // TODO: check this to get devices only for the current logged in user
    // we get the user email from checkauth, add the use email to the device
    // as an owner when it is created, then search for that

    // TODO: change this to accept a 'type' in the body that determines whether
    // to get the list of devices that the user has read or write access to

    const docs = await Device.find()
      .select("-__v")
      .exec();
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
      timeout: req.body.timeout,
      ownerId: new mongoose.Types.ObjectId(req.userData.userId)
    });
    const result = await device.save();

    // TODO: alter the user to add result._id to their 'writes' list
    // Also add the user email to the device as an 'owner'

    console.log(result);
    res.status(201).json({ message: "Device created" });
  } catch (err) {
    return next(err);
  }
};
