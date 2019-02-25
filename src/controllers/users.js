import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user";

export const get_all_users = async (req, res, next) => {
  try {
    const docs = await User.find()
      .select("_id email")
      .exec();
    const response = { count: docs.length, users: docs };
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
};

export const sign_up_user = async (req, res, next) => {
  try {
    // Try to find a matching email to make sure we don't double-signup
    const foundUser = await User.find({ email: req.body.email });
    if (foundUser.length >= 1) {
      return res.status(409).json({ error: { message: "Mail exists" } });
    }

    // No user found, continue. Salt and hash the password then save.
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({ email: req.body.email, password: hash });
    const result = await user.save();

    console.log(result);
    res.status(201).json({ message: "User created" });
  } catch (err) {
    return next(err);
  }
};

export const login_user = async (req, res, next) => {
  try {
    // Attempt to find the user with with matching email.
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(401).json({ error: { message: "Auth failed" } });
    }
    // Compare the passwords
    const result = await bcrypt.compare(req.body.password, user.password);
    if (!result) {
      return res.status(401).json({ error: { message: "Auth failed" } });
    }
    // Generate a JSON web token to use for auth based on the email and id.
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_KEY,
      { expiresIn: "100d" }
    );
    return res.status(200).json({ message: "auth successful", token: token });
  } catch (err) {
    next(err);
  }
};

export const delete_user = async (req, res, next) => {
  try {
    await User.deleteOne({ _id: req.params.userId }).exec();
    return res.status(200).json({ message: "user deleted" });
  } catch (err) {
    next(err);
  }
};
