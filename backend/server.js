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

  client.on("close", () => {
    clients.forEach((c, i) => {
      if (c === client) {
        clients.splice(i, 1);
      }
    });
  });
  client.on("message", (m) => {
    const msg = JSON.parse(m);
    const room = msg.id;
    switch (msg.type) {
      case "connection":
        client.name = msg.message;
        break;
      case "message":
        console.log(client.name);
        msg.id = client.name;
        if (rooms[room]) {
          rooms[room].attendees.forEach((c) => {
            c.send(JSON.stringify(msg));
          });
        }
        break;
      case "join":
        if (!rooms[room]) {
          rooms[room] = {
            name: "",
            host: client,
            attendees: [],
          };
        }
        rooms[room].attendees.push(client);

        rooms[room].attendees.forEach((c) => {
          if (c !== client) {
            c.send(JSON.stringify(msg));
          }
        });
        break;
      case "leave":
        break;
    }
  });
});
