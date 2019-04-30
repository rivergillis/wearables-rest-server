// These need to be the first things imported in the app
import "@babel/polyfill"; // Node6 support for GCP
import "dotenv/config"; // Pull in the dotenv

import http from "http";
import app from "./app";

const port = process.env.PORT || 3000;
const server = http.createServer(app); // the express app is a request handler

// Start the server
server.listen(port);

console.log("Server running on http://localhost:3000");
