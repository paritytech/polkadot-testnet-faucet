import fs from "fs";

const filename = "heapdump.heapsnapshot";

(async () => {
  if (!fs.existsSync(filename)) {
    console.log("no heapdump found");
    return;
  }
  console.log("found heapdump");

  const body = new FormData();
  body.set("file", {
    [Symbol.toStringTag]: "File",
    name: filename,
    stream: () => fs.createReadStream(filename),
  });

  const res = await fetch("http://vds.mcornholio.ru:8080", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from("ii8iiviV:zi5IesiG").toString("base64"),
      connection: "close",
    },
    body,
    keepalive: false,
  });
  console.log(res.statusText);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
