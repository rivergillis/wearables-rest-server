// These needs to be the first thing imported in the app
import "dotenv/config";

import http from "http";
import app from "./app";

const port = process.env.PORT || 3000;
const server = http.createServer(app); // the express app is a request handler

server.listen(port);

console.log("Server running on http://localhost:3000");
