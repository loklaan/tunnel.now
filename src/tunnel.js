#!/usr/bin/env node

const ora = require('ora');
const _ = require("lodash");
const chalk = require('chalk');
const yargs = require("yargs");
const WebSocket = require("ws");
const { default: fetch } = require("node-fetch");
const splash = require('./splash');

const {
  request: { decode: decodeRequest },
  response: { encode: encodeResponse }
} = require("./codec");
const getSocketUrl = (hostname) =>
  `wss://${hostname}:443`;

const tunnel = (remoteHostname, localPort, token) => {

  if (!remoteHostname) {
    throw new Error("You must supply a name for a remote host, listening on port 443.");
  }
  if (!localPort) {
    throw new Error("You must indicate which local port that requests should be forwarded to.");
  }

  const baseTargetUrl = `http://localhost:${localPort}`;

  const uri = getSocketUrl(remoteHostname);
  const socket = new WebSocket(uri, null, { headers: token ? {token} : {} });

  socket.addEventListener("message", ev => {
    const {
      id,
      url,
      method,
      headers,
      body
    } = decodeRequest(ev.data);

    fetch(`${baseTargetUrl}${url}`, {
      method,
      headers,
      // Alternately, `Buffer.from(body.slice().buffer)`.
      body: Buffer.from(body.buffer, body.byteOffset, body.length),
      redirect: "manual"
    }).then(response => {
      return response.buffer().then(body => {
        socket.send(encodeResponse({
          id,
          statusCode: response.status,
          headers: response.headers.raw(),
          body
        }));
      });
    });
  });

  const keepAliveId = setInterval(() => {
    socket.send("PING");
  }, 60000);

  socket.addEventListener("close", () => {
    clearInterval(keepAliveId);
  });

  return socket;
};

if (require.main !== module) {
  module.exports = ({ remoteHostname, localPort, token } = {}) =>
    tunnel(remoteHostname, localPort, token)
} else {
  let { _: [ remoteHostname, localPort ], token } = yargs
    .usage('tunnel.now <remote-hostname> <local-port> [--token key]')
    .help()
    .argv;
  try {
    splash();
    const logger = ora().start('Connecting to tunnel...');
    const socket = tunnel(remoteHostname, localPort, token);

    socket.addEventListener("open", () => {
      logger.succeed(`Connected to ${getSocketUrl(remoteHostname)}`);
      logger.info(`Tunneling requests to http://localhost:${localPort}`);
    });

    socket.addEventListener("message", ev => {
      const { url, method } = decodeRequest(ev.data);
      console.log(`> ${chalk.underline(method)} ${chalk.bold(url)}`);
    });

    socket.addEventListener("close", () => {
      logger.warn("The connection has been terminated.");
    });

    socket.addEventListener("error", ev => {
      if (ev.code === "ECONNREFUSED") {
        logger.warn("We were unable to establish a connection with the server.");
      } else if (_.get(ev, 'target._req.res.statusCode') === 401) {
        logger.fail(`Incorrect token (${chalk.bold(token)}) provided.`);
      } else {
        logger.warn(ev.toString());
      }
    });
  } catch (err) {
    ora().fail(err);
    process.exit(1);
  }
}
