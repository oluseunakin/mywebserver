import http from "http";
import { fillProject, getProjects, getStack } from "./helper.js";
import { initializeApp } from "firebase/app";
import { getDatabase, push, ref, onValue} from "firebase/database"
import { getStorage, ref as storageRef, uploadBytes } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBd_O6VnoJnMZqUoob0yFt9LujDH4mX2_0",
  authDomain: "mywebserver-65685.firebaseapp.com",
  projectId: "mywebserver-65685",
  storageBucket: "mywebserver-65685.appspot.com",
  messagingSenderId: "490803251890",
  appId: "1:490803251890:web:b620aa1bf3ccdc287a57ab",
  measurementId: "G-W9Q81KXD7C"
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app)
const storage = getStorage()

const projectRef = ref(database, '/projects')

const server = http.createServer(async (req, res) => {
  const path = req.url ? decodeURIComponent(req.url) : "/";
  res.setHeader("access-control-allow-origin", "https://oluseunakin.github.io");

  if (path === "/addproj") {
    const form = IncomingForm({ multiples: true, keepExtensions: true });
    form.parse(req, async (error, fields, files) => {
      if (error) {
        res.statusCode = 401;
        res.end("Invalid data sent by user");
      }
      push(projectRef, fields)
      push(ref(database, 'stacks'), fields.tech)
      files.pics.forEach((pic, i) => {
        const picRef = storageRef(storage, `${fields.name}/${pic.name}`)
        uploadBytes(picRef, pic).then(file => {
          console.log(file)  
        })
      });
      /* const filenames = await readdir(`${filebase}/${fields.name}`);
      res
        .writeHead(201, { "Content-Type": "text/html" })
        .end(fillProject(fields, filenames)); */
    });
  } else if (path === "/getstack") { 
    res.setHeader("content-type", "application/json");
    const stackRef = ref(database, '/stacks')
    onValue(stackRef, snapshot => {
      response.end(snapshot.val)
    })
  } else if (path.includes("/projects")) {
    const slicedPath = path.slice(9);
    const pic = await readFile(`${filebase}/${slicedPath}`);
    res.end(pic);
  }  else if (path === "/getprojects") {
    
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
