import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import usersRouter from "./routes/users";

const app = express();

// use morgan middleware to log requests
app.use(morgan("dev"));
// use body parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(
  `mongodb+srv://admin:${
    process.env.MONGO_ADMIN_PASSWORD
  }@wearables-rest-0bowk.gcp.mongodb.net/test?retryWrites=true`,
  { useNewUrlParser: true }
);

// Route request handlers
app.use("/users", usersRouter);

// Enable cross-origin-resource-sharing (possibly not needed, but stops some errors)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // Browser first sends a request to find out what options are available. Handle it here.
  // This is also probably not needed
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next(); // forward the request so that we don't block it
});

// Handle requests that made it past everything above
app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error); // forward the error request
});

// handle errors from anywhere in the app
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
});

export default app;
