import http from "http";
import { fillProject } from "./helper.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import IncomingForm from "formidable";
import { readFile } from "fs";

const firebaseConfig = {
  apiKey: "AIzaSyBd_O6VnoJnMZqUoob0yFt9LujDH4mX2_0",
  authDomain: "mywebserver-65685.firebaseapp.com",
  projectId: "mywebserver-65685",
  storageBucket: "mywebserver-65685.appspot.com",
  messagingSenderId: "490803251890",
  appId: "1:490803251890:web:b620aa1bf3ccdc287a57ab",
  measurementId: "G-W9Q81KXD7C",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);
const storage = getStorage();
const server = http.createServer(async (req, res) => {
  const path = req.url ? decodeURIComponent(req.url) : "/";
  res.setHeader("access-control-allow-origin", "https://oluseunakin.github.io");
  //res.setHeader("access-control-allow-origin", "http://127.0.0.1:5500");
  if (path === "/addproj") {
    const form = IncomingForm({ multiples: true, keepExtensions: true });
    form.parse(req);
    const fields = {};
    const files = [];
    let title, tech;
    form
      .on("file", (formname, file) => {
        readFile(file.filepath, (err, data) => {
          uploadBytes(
            storageRef(
              storage,
              `${title.replace(" ", "")}/${file.originalFilename}`
            ),
            data,
            { contentType: file.mimetype }
          )
            .then((result) => {
              files.push(result.ref.fullPath);
            })
            .finally(() => {
              fields["files"] = files;
              Promise.allSettled([
                set(ref(database, "projects/" + title), fields),
                set(ref(database, "stack/" + title), tech),
              ]);
            });
        });
      })
      .on("field", (name, value) => {
        if (name === "name") title = value;
        if (name === "tech") tech = value.split(",");
        fields[name] = value;
      })
      .on("end", () => {
        res.end("data written");
        /* res
          .writeHead(201, { "content-type": "text/html" })
          .end(fillProject(fields, files)); */
      });
  } else if (path === "/getstack") {
    res.setHeader("content-type", "application/json");
    const stackRef = ref(database, "stack");
    onValue(stackRef, (snapshot) => {
      const stacks = Object.keys(snapshot.val())
        .map((s, i, arr) => arr[s])
        .flat();
      res.end(JSON.stringify(stacks));
    });
  } else if (path === "/getprojects") {
    onValue(ref(database, "projects"), (snapshot) => {
      const projects = snapshot.val();
      if (projects) {
        res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(JSON.stringify(projects));
      } else res.end("no data");
    });
  } else if (path.includes("projects")) {
    onValue(
      ref(database, `projects/${path.substring(9)}`),
      async (snapshot) => {
        const fields = snapshot.val();
        let urls = fields.files.map(
          async (file) => await getDownloadURL(storageRef(storage, file))
        );
        urls = await Promise.allSettled(urls);
        res
          .writeHead(200, { "Content-Type": "text/html" })
          .end(fillProject(fields, urls));
      }
    );
  } else if (path === "/healthcheck") {
    res.writeHead(200).end("app is okay");
  } else {
    res.writeHead(200).end("welcome");
  }
});

server.listen(process.env.PORT, () => {
  console.log("server started ");
});

server.on("error", (e) => {
  console.log(e.message);
});
