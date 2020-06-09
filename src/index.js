const express = require("express");
const http = require("http");
const debug = require("debug");

const { setupSocketServer } = require("./socket");
const { setupApiServer } = require("./api");

const serverDebug = debug("server");
const app = express();
const port = process.env.PORT || 80;
const server = http.createServer(app);

setupSocketServer(server);
setupApiServer(app);

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});
