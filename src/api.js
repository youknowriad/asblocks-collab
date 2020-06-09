const debug = require("debug");
const firebase = require("firebase");
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuid } = require("uuid");
const config = require("./config");

const firebaseApp = firebase.initializeApp(config.firebase);
const db = firebaseApp.firestore();

const apiDebug = debug("api");

async function signIn() {
    if ( !!firebase.auth().currentUser) {
        return;
    }
    await firebase.auth().signInWithEmailAndPassword(config.user.email, config.user.password);
}

function setupApiServer(app) {
  app.use(bodyParser.json());
  app.use(cors());
  app.post("/api/share", async (req, res) => {
    apiDebug("share a new post");
    await signIn();
    const ownerKey = uuid();
    const doc = await db.collection("posts").add({
      status: "publish",
      ownerKey,
    });

    res.send({
      _id: doc.id,
      status: "publish",
      ownerKey,
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
    const { encrypted } = req.body;
    await db.collection("posts").doc(req.params.id).set({
      encrypted,
      status: "publish",
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
