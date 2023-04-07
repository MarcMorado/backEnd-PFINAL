
const mongoose = require( 'mongoose');

const WeaponSchema = new mongoose.Schema({
  name: { type: String, required: true}, // String is shorthand for {type: String}
  damage:  { type: String, required: false}
});

mongoose.model('Weapon', WeaponSchema);