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
import * as dotenv from "dotenv";
import sharp from "sharp";

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
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
    const smallfiles = [];
    let title, tech;
    form
      .on("file", (formname, file) => {
        readFile(file.filepath, async (err, data) => {
          if (data.byteLength > 100000) {
            const smallbuf = await sharp(data).blur().toBuffer();
            const smallresult = await uploadBytes(
              storageRef(
                storage,
                `${title.replace(" ", "")}/small${file.originalFilename}`
              ),
              smallbuf,
              { contentType: file.mimetype }
            );
            smallfiles.push(smallresult.ref.fullPath);
            fields["smallfiles"] = smallfiles;
          }
          const result = await uploadBytes(
            storageRef(
              storage,
              `${title.replace(" ", "")}/${file.originalFilename}`
            ),
            data,
            { contentType: file.mimetype }
          );
          files.push(result.ref.fullPath);
          fields["files"] = files;
          Promise.allSettled([
            set(ref(database, "projects/" + title), fields),
            set(ref(database, "stack/" + title), tech),
          ]);
        });
      })
      .on("field", (name, value) => {
        if (name === "name") title = value;
        if (name === "tech") tech = value.split(",");
        fields[name] = value;
      });
    req.on("end", () => {
      res.end("data written");
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
        let urls = fields.smallfiles.map(
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
