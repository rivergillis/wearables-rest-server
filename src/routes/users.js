import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// const User = require("../models/user");

const router = express.Router();

router.post("/signup", async (req, res, next) => {
  // try {
  //   const foundUser = await User.find({ email: req.body.email });
  //   if (foundUser.length >= 1) {
  //     return res.status(409).json({ message: "Mail exists" });
  //   }
  //   // No user found, continue. Salt and hash the password then save.
  //   const hash = await bcrypt.hash(req.body.password, 10);
  //   const user = new User({ email: req.body.email, password: hash });
  //   const result = await user.save();
  //   console.log(result);
  //   res.status(201).json({ message: "User created" });
  // } catch (err) {
  //   console.log(err);
  //   return res.status(500).json({ error: err });
  // }
});

router.post("/login", async (req, res, next) => {
  // try {
  //   const user = await User.find({ email: req.body.email }).exec();
  //   if (user.length < 1) {
  //     return res.status(401).json({ message: "Auth failed" });
  //   }
  //   const result = await bcrypt.compare(req.body.password, user[0].password);
  //   if (!result) {
  //     return res.status(401).json({ message: "Auth failed" });
  //   }
  //   // Generate a JSON web token to use for auth.
  //   const token = jwt.sign(
  //     { email: user[0].email, userId: user[0]._id },
  //     process.env.JWT_KEY,
  //     { expiresIn: "1h" }
  //   );
  //   return res.status(200).json({ message: "auth successful", token: token });
  // } catch (err) {
  //   console.log(err);
  //   return res.status(500).json({ error: err });
  // }
});

router.delete("/:userId", async (req, res, next) => {
  // try {
  //   const result = await User.deleteOne({ _id: req.params.userId }).exec();
  //   return res.status(200).json({ message: "user deleted" });
  // } catch (err) {
  //   res.status(500).json({ error: err });
  // }
});

export default router;
