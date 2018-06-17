const { createServer, STATUS_CODES } = require("http");

const yargs = require("yargs");
const WebSocket = require("ws");
const getRawBody = require("raw-body");

const {
  request: { encode: encodeRequest },
  response: { decode: decodeResponse }
} = require("./codec");


const { _: [ port = 8008 ] } = yargs
  .usage('$0 [port]')
  .help()
  .argv;


let activeConnection = null;
let nextId = 0;

const responseRefs = {};
const server = createServer((req, res) => {
  if (!activeConnection) {
    res.statusCode = 503;
    res.end("Tunneling client is not currently connected.");
    return;
  }

  getRawBody(req).then(buffer => {
    const id = nextId++;
    responseRefs[id] = res;
    activeConnection.send(encodeRequest({
      id,
      url: req.url,
      method: req.method,
      headers: req.headers,
      // Buffers behave like instances of Uint8Arrays.
      body: buffer
    }));
  });
});

const handleResponse = message => {
  if (message === "PING") { return; }
  const { id, statusCode, headers, body } = decodeResponse(message);
  const res = responseRefs[id];
  responseRefs[id] = null;

  res.statusCode = statusCode;
  Object.keys(headers).forEach(key => res.setHeader(key, headers[key]));
  // Alternately, `Buffer.from(body.slice().buffer)`.
  res.end(Buffer.from(body.buffer, body.byteOffset, body.length));
};

const verifyClient = (info, cb) => {
  if (process.env.TUNNEL_TOKEN) {
    const tokenKey = info.req.headers.token;
    console.log(info.req.headers);
    console.log(tokenKey);
    console.log(process.env.TUNNEL_TOKEN);
    if (tokenKey === process.env.TUNNEL_TOKEN) {
      return cb(true);
    }
    cb(false, 401, STATUS_CODES[401]);
  } else {
    cb(true);
  }
};

const wsServer = new WebSocket.Server({ server, verifyClient });
wsServer.on("connection", (ws, req) => {
  if (activeConnection) { ws.close("A client is already connected."); }
  const remoteIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`Tunnel connected from $${remoteIP}.`);
  activeConnection = ws;
  ws.on("close", () => {
    activeConnection = null;
    console.log(`Tunnel disconnected from $${remoteIP}.`)
  });
  ws.on("message", handleResponse);
});

server.listen(port, () => {
  console.log(`Listening on port ${server.address().port}...`);
});
