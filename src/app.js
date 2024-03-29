import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import usersRouter from "./routes/users";
import devicesRouter from "./routes/devices";

const app = express();

// use morgan middleware to log requests
app.use(morgan("dev"));
// use body parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Change this connection string to wherever you are hosting your MongoDB instance
mongoose.connect(
  `mongodb://admin:${
    process.env.MONGO_ADMIN_PASSWORD
  }@wearables-rest-shard-00-00-0bowk.gcp.mongodb.net:27017,wearables-rest-shard-00-01-0bowk.gcp.mongodb.net:27017,wearables-rest-shard-00-02-0bowk.gcp.mongodb.net:27017/test?ssl=true&replicaSet=wearables-rest-shard-0&authSource=admin&retryWrites=true`,
  { useNewUrlParser: false }, // mongodb on GCP needs this right now
  err => {
    if (err) {
      return console.error(err);
    }
  }
);

// Route request handlers
app.use("/users", usersRouter);
app.use("/devices", devicesRouter);

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

// Handle requests that made it past everything above (with a 404)
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
