import http from "http"

const server = http.createServer((req, res) => {
    console.log(req.url)
})

server.listen(() => {
    console.log("server started")
})

server.on('error', e => {
    console.log(e)
})