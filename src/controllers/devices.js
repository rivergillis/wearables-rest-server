import jwt from "jsonwebtoken";

import Device from "../models/device";

export const get_all_devices = async (req, res, next) => {
  try {
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
    const device = new Device({ name: req.body.name });
    const result = await device.save();

    // TODO: alter the user to add result._id to their 'writes' list

    console.log(result);
    res.status(201).json({ message: "Device created" });
  } catch (err) {
    return next(err);
  }
};
