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

const fillProject = (field, urls, bigurls) => {
  let savedFilenames = ``
  urls.forEach(async (url, i) => {
    const u = url.value
    const big = bigurls[i].value
    savedFilenames += `<a class="imageDiv" href=${big}><img src="${u}" alt="Can't load image" /></a>`
  })
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://oluseunakin.github.io/css/proj.css">
      <link rel="stylesheet" href="https://oluseunakin.github.io/css/init.css" />
      <title>${field.name}</title>
  </head>
  <body>
    <header>
      <a href="https://oluseunakin.github.io" class="home"></a>
      <div>
        <h1>${field.name}</h1>
        <h4>${field.tech}</h4>
        <p>${field.description}</p>
        <a href=${field.link}>${field.link}</a>
      </div>
    </header>
    <main class="imageGrid"> ${savedFilenames} </main>
    <script>
      alert("Images have been resized to save bandwidth, click to see more")
    </script>
  </body>
  </html>`
}

export { fillProject };
