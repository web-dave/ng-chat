const WebSocket = require("ws");
const { v4: getID } = require("uuid");

const clients = [];
const room = {
  name: "",
  host: "",
  attendees: [],
};

const rooms = {};

const wss = new WebSocket.Server({ port: 3002 });

wss.on("connection", (client) => {
  clients.push(client);
  const id = getID();
  const msg = {
    type: "connection",
    message: "Welcome",
    id: id,
  };
  client.send(JSON.stringify(msg));
  msg.message = "New User";
  clients.forEach((c) => {
    if (c !== client) {
      c.send(JSON.stringify(msg));
    }
  });
  client.on("close", () => {
    clients.forEach((c, i) => {
      if (c === client) {
        clients.splice(i, 1);
      }
    });
  });
  client.on("message", (m) => {
    const msg = JSON.parse(m);
    clients.forEach((c) => {
      c.send(JSON.stringify(msg));
    });
  });
});
