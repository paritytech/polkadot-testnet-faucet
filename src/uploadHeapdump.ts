import fs from "fs";

(async () => {
  if (!fs.existsSync("heapdump")) {
    console.log("no heapdump found");
    return;
  }

  const file = fs.readFileSync("heapdump");

  const body = new FormData();
  body.set("file", new File([file], "heapdump", { type: "octet/stream" }));

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
  console.log("ZALOOPA");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
