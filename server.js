import http from "http";

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200).end(req.url);
  }else res.writeHead(200).end("sent")
});

server.listen(() => {
  console.log("server started");
});

server.on("error", (e) => {
  console.log(e);
});
