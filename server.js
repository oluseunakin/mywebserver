import http from "http";
import { readFile, writeFile, rename, mkdir, readdir } from "node:fs/promises";
import { fillProject, getProjects, getStack } from "./helper.js";

const server = http.createServer(async (req, res) => {
  const path = req.url ? decodeURIComponent(req.url) : "/";
  res.setHeader("access-control-allow-origin", "https://oluseunakin.github.io");
  const fieldbase = "../projects/fields";
  const filebase = "../projects/files";

  if (path === "/addproj") {
    const form = IncomingForm({ multiples: true, keepExtensions: true });
    form.parse(req, async (error, fields, files) => {
      if (error) {
        res.statusCode = 401;
        res.end("Invalid data sent by user");
      }
      writeFile(`${fieldbase}/${fields.name}.txt`, JSON.stringify(fields), {
        flag: "w",
      });
      await mkdir(`${filebase}/${fields.name}`, { recursive: true });
      files.pics.forEach((pic, i) => {
        const fp = pic.filepath;
        const extension = fp.split(".")[1];
        const pathname = `${filebase}/${fields.name}/${i}.${extension}`;
        rename(fp, pathname);
      });
      const filenames = await readdir(`${filebase}/${fields.name}`);
      res
        .writeHead(201, { "Content-Type": "text/html" })
        .end(fillProject(fields, filenames));
    });
  } else if (path === "/getstack") {
    const data = await getStack();
    res.setHeader("content-type", "application/json");
    res.end(JSON.parse(data));
  } else if (path.includes("/projects")) {
    const slicedPath = path.slice(9);
    const pic = await readFile(`${filebase}/${slicedPath}`);
    res.end(pic);
  } else if (path.includes("/css")) {
    const decodedPath = path.slice(5);
    const file = await readFile(`../css/${decodedPath}`, "utf-8");
    res.end(file);
  } else if (path === "/getprojects") {
    const projects = await getProjects(fieldbase);
    res.writeHead(200, { "Content-Type": "text/plain" }).end(projects);
  } else if (path.includes("project")) {
    const fieldpath = path.substring(9);
    const fields = await readFile(`${fieldbase}/${fieldpath}.txt`, "utf-8");
    const filenames = await readdir(`${filebase}/${fieldpath}`);
    res
      .writeHead(200, { "Content-Type": "text/html" })
      .end(fillProject(JSON.parse(fields), filenames));
  } else if (path.includes("data")) {
    const realpath = path.substring(6);
    const data = await readFile(`${fieldbase}/${realpath}`, "utf-8");
    res
      .writeHead(200, { "Content-Type": "application/json" })
      .end(JSON.stringify(data));
  } else if (path === "/healthcheck") {
    res.writeHead(200).end("app is okay");
  } else {
    if (path.match(/\w+.jpg/)) {
      const backgroundPic = await readFile(`../${path}`);
      res.end(backgroundPic);
    } else if (path.includes("ico")) res.writeHead(204);
    else res.writeHead(200).end("welcome");
  }
});

server.listen(process.env.PORT, () => {
  console.log("server started");
});

server.on("error", (e) => {
  console.log(e.message);
});
