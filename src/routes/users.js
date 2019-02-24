import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../models/user";

const router = express.Router();

// GET /users/
// Returns a list of every user (passwords hidden)
router.get("/", async (req, res, next) => {
  try {
    const docs = await User.find()
      .select("_id email")
      .exec();
    const response = { count: docs.length, users: docs };
    return res.status(200).json(response);
  } catch (err) {
    return next(err);
  }
});

// POST /users/signup with a User (email, password)
// Signs up a new user.
router.post("/signup", async (req, res, next) => {
  try {
    // Try to find a matching email to make sure we don't double-signup
    const foundUser = await User.find({ email: req.body.email });
    if (foundUser.length >= 1) {
      return res.status(409).json({ message: "Mail exists" });
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
});

// POST /users/login with a User (email, password)
// Logs the user in.
// Returns a JWT (auth token) to be used for future requests.
router.post("/login", async (req, res, next) => {
  try {
    // Attempt to find the user with with matching email.
    const user = await User.findOne({ email: req.body.email }).exec();
    if (!user) {
      return res.status(401).json({ message: "Auth failed" });
    }
    // Compare the passwords
    const result = await bcrypt.compare(req.body.password, user.password);
    if (!result) {
      return res.status(401).json({ message: "Auth failed" });
    }
    // Generate a JSON web token to use for auth based on the email and id.
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      process.env.JWT_KEY,
      { expiresIn: "24h" }
    );
    return res.status(200).json({ message: "auth successful", token: token });
  } catch (err) {
    next(err);
  }
});

// DELETE /users/:userId
// Deletes the user with id of userID
router.delete("/:userId", async (req, res, next) => {
  try {
    await User.deleteOne({ _id: req.params.userId }).exec();
    return res.status(200).json({ message: "user deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
