const debug = require("debug");
const bodyParser = require("body-parser");
const cors = require("cors");
const apiDebug = debug("api");
const { signIn, db } = require("./firebase");

function setupApiServer(app) {
  app.use(bodyParser.json());
  app.use(cors());

  app.post("/api/share/:ownerKey", async (req, res) => {
    apiDebug("share a new post");
    await signIn();
    const doc = await db.collection("posts").add({
      status: "publish",
      ownerKey: req.params.ownerKey,
    });

    res.send({
      _id: doc.id,
      status: "publish",
    });
  });

  app.get("/api/read/:id", async (req, res) => {
    apiDebug("read Id " + req.params.id);
    const snapshot = await db.collection("posts").doc(req.params.id).get();
    const { encrypted, status } = snapshot.data();
    res.send({
      _id: snapshot.id,
      status,
      encrypted,
    });
  });

  app.put("/api/save/:id/:ownerKey", async (req, res) => {
    apiDebug(
      "save Id " + req.params.id + "with permission key " + req.params.ownerKey
    );
    await signIn();
    const snapshot = await db.collection("posts").doc(req.params.id).get();
    if (snapshot.data().ownerKey !== req.params.ownerKey) {
      return res.status(401).send({ message: "Incorrect permissions" });
    }
    const { encrypted } = req.body;
    await db.collection("posts").doc(req.params.id).set({
      encrypted,
      status: "publish",
      ownerKey: req.params.ownerKey,
    });
    return res.send({
      _id: req.params.id,
      encrypted,
      status: "publish",
    });
  });
}

module.exports = {
  setupApiServer,
};
