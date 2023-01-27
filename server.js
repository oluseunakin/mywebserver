import http from "http";

const server = http.createServer((req, res) => {
  res.end('bye')
});

server.listen(() => {
  console.log("server started");
});

server.on("error", (e) => {
  console.log(e.message);
});
