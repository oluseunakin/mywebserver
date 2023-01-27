import { readFile, readdir } from "node:fs/promises";

async function getStack() {
  const path = "../projects/stack";
  const data = await readFile(path, "utf-8");
  return data;
}

const isFormField = (data) => {
  return data.includes("------WebKitFormBoundary");
};
const parser = (data) => {
  const boundaryRegex = /-{6}WebKitFormBoundary\w+\r\n/gm
  const endRegex = /-{6}WebKitFormBoundary\w+--/gm
  const split = data.split(boundaryRegex);
  let files = [];
  const fields = [];
  split.forEach((data) => {  
    const r = data.match(
      /name.+\r\n\r\n.+|name.+filename.+\.\w+|Content-Type.+|Content-Disposition.+/g
    );
    if (data.includes("filename")) {
      const file = data.replace(r[0], "").replace(r[1], "").replace(endRegex, '').trim();
      files.push(file)
    }
    if(r) {
      const trimmedR = r.map(rr => rr.replace(/[\r\n]/, ' ').replace(/\s\s/, ''))
      fields.push(trimmedR);
    }
  });
  return { fields, files };
};

const formfieldParser = (data) => {
  const split = data.split(/-{6}WebKitFormBoundary\w+\r\n/gm);
  const filteredSplit = split.filter((data) => data !== "");
  let replacedSplit = filteredSplit.map((data) =>
    data
      .replace(/[\r\n]/g, " ")
      .replace(/\s\s+/, " ")
      .replace(/[":;]/g, "")
  );
  let fields = [];
  const files = [];
  replacedSplit.forEach((data) => {
    if (data.includes("filename")) {
      let splittedData = data.split(" ");
      const shard = splittedData.filter((d, i, arr) => {
        const regExp = /\w+[=]\w*/;
        const passed = regExp.test(d);
        if (passed) {
          arr[i] = "";
          splittedData = arr.join(" ");
        }
        return passed;
      });
      const [cd, fd, name, filename, ct, ctValue] = shard;
      const [n, v] = name.split("=");
      const [nf, vf] = filename.split("=");
      fields.push({ [n]: v, [nf]: vf, [ct]: ctValue });
      splittedData = splittedData.trim();
      files.push(splittedData);
    } else {
      const field = data.split("=")[1].trimEnd().split(/\s/);
      const [first, ...others] = field;
      fields.push({ [first]: others.join(" ") });
    }
  });
  //console.log(files)
  return { fields, files };
};

const getProjects = async (path) => {
  const files = await readdir(path)
  return JSON.stringify(files)
}

const fillProject = (field, files) => {
  let savedFilenames = ``
  files.forEach((fp, i) => {
    const extension = fp.split(".")[1];
    savedFilenames += `<div class="imageDiv"><img src="https://portfolioserver-c6d2.onrender.com/projects/${field.name}/${i}.${extension}" alt="Can't load image" /></div>`
  })
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="../css/proj.css">
      <link rel="stylesheet" href="../css/init.css" />
      <title>Document</title>
  </head>
  <body>
      <div>
          <div>
              <h1>${field.name}</h1>
              <h2>${field.description}</h2>
              <h4>${field.tech}</h4>
          </div>
          <div class="imageGrid">
            ${savedFilenames}
          </div>
      </div>
  </body>
  </html>`
}

export { getStack, formfieldParser, isFormField, parser, getProjects, fillProject };
