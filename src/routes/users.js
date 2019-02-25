import express from "express";

import checkAuth from "../middleware/check-auth";
import * as UsersController from "../controllers/users";

const router = express.Router();

// GET /users/
// Returns a list of every user (passwords hidden)
router.get("/", UsersController.get_all_users);

// POST /users/signup with a User
// BODY: email, password
// Signs up a new user.
router.post("/signup", UsersController.sign_up_user);

// POST /users/login with a User
// BODY: email, password
// Logs the user in.
// Returns a JWT (auth token) to be used for future requests.
router.post("/login", UsersController.login_user);

// DELETE /users/:userId
// HEADERS: Bearer auth token
// Deletes the user with id of userID
// TODO: Protect this somehow, use an admin key?
router.delete("/:userId", checkAuth, UsersController.delete_user);

export default router;
