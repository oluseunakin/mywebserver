import http from "http";

console.log(process.env.PORT)
const server = http.createServer((req, res) => {
  const path = req.url
  if(path === "/favicon.ico") {
    res.writeHead(200).end(Buffer.alloc(4, 1), 'base64')
  }else {
    res.writeHead(200).end("hello")
  }
});

server.listen(process.env.PORT, () => {
  console.log("server started");
});

server.on("error", (e) => {
  console.log(e.message);
});
