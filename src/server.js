const { createServer, STATUS_CODES } = require("http");

const WebSocket = require("ws");
const getRawBody = require("raw-body");

const {
  request: { encode: encodeRequest },
  response: { decode: decodeResponse },
  responseJson: { decode: decodeJsonResponse },
} = require("./codec");

let activeConnection = null;
let nextId = 0;

const responseRefs = {};
const server = createServer((req, res) => {
  if (!activeConnection) {
    res.statusCode = 503;
    console.error("Tunneling client is not currently connected.");
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
  })
    .catch(err => {
      console.error(err);
      res.statusCode = 503;
      res.end(err.message);
    });
});

const handleResponseWithDecoderFallbacks = (message, decoders, decoderIndex = 0) => {
  if (message === "PING") { return; }
  try {
    const { id, statusCode, headers, body } = decoders[decoderIndex](message);
    const res = responseRefs[id];
    responseRefs[id] = null;

    res.statusCode = statusCode;
    Object.keys(headers).forEach(key => res.setHeader(key, headers[key]));
    // Alternately, `Buffer.from(body.slice().buffer)`.
    res.end(Buffer.from(body.buffer, body.byteOffset, body.length));
  } catch (err) {
    if ((decoderIndex + 1) in decoders) {
      console.error('Error handling response. Retrying with different decoder.')
      handleResponseWithDecoderFallbacks(message, decoders, decoderIndex + 1);
    } else {
      console.error('Error handling response.')
      console.error('Message:', message.toString('utf8'))
      console.error('Error:')
      console.error(err)
    }
  }
};
const handleResponse = (message) => handleResponseWithDecoderFallbacks(
  message,
  [
    decodeResponse,
    decodeJsonResponse,
  ]
);

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

console.log("Creating socket server.");
const wsServer = new WebSocket.Server({ server, verifyClient });
wsServer.on("connection", (ws, req) => {
  console.log("A client is connecting.");
  if (activeConnection) {
    console.error("A client is already connected.");
    ws.close("A client is already connected.");
  }
  const remoteIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log(`Tunnel connected from $${remoteIP}.`);
  activeConnection = ws;
  ws.on("close", () => {
    activeConnection = null;
    console.log(`Tunnel disconnected from $${remoteIP}.`)
  });
  ws.on("message", handleResponse);
});

console.log(`Starting server...`);
server.listen(process.env.PORT, () => {
  console.log(`Listening on port ${server.address().port}...`);
});
