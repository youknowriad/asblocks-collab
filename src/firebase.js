const firebase = require("firebase");
const config = require("./config");

const firebaseApp = firebase.initializeApp(config.firebase);
const db = firebaseApp.firestore();
async function signIn() {
  if (!!firebase.auth().currentUser) {
    return;
  }
  await firebase
    .auth()
    .signInWithEmailAndPassword(config.user.email, config.user.password);
}

module.exports = {
  db,
  signIn,
};
