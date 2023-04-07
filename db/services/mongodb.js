var mongoose = require("mongoose");
require('./../schemas/weapons');
const collection = "Weapons";
// The current database to use.
function connectToDb() {
  // make a connection
  mongoose.connect("mongodb+srv://Marc:1234@final.awdtnsf.mongodb.net/test", {
    dbName: "dnd",
  });
  // get reference to database
  db.on("error", console.error.bind(console, "connection error:"));
}
const weapon = require("./../schemas/weapons");
const db = mongoose.connection;

async function saveWeapon(data) {
//   if (!db.getCollection(collection)) {
//     db.createCollection(collection);
//   }

  const weaponModel = mongoose.model("Weapon", weapon.weaponSchema, collection);
  const newWeapon = new weaponModel(data);
  const saved = await newWeapon.save();
}
// Create a new collection.
exports.saveWeapon = saveWeapon;
exports.connectToDb = connectToDb;
