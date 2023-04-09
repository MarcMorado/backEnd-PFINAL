const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  charName: String,
  race: String,
  class: String,
  level: Number,
  background: String,
  alignment: String,
  expPoints: Number,
  armorClass: Number,
  initiative: Number,
  speed: Number,
  hitPoints: Number,
  inspiration: Number,
  proficiencyBonus: Number,
  equipment: {
    armor: Object,
    weapon: Object,
  },
  stats: {
    str: Number,
    dex: Number,
    const: Number,
    int: Number,
    wis: Number,
    char: Number,
  },
  savingThrows: {
    str: Number,
    dex: Number,
    const: Number,
    int: Number,
    wis: Number,
    char: Number,
  },
  skills: {
    acrobatics: Number,
    animalHandling: Number,
    arcana: Number,
    athletics: Number,
    deception: Number,
    history: Number,
    insight: Number,
    intimidation: Number,
    investigation: Number,
    medicine: Number,
    nature: Number,
    perception: Number,
    performance: Number,
    persuasion: Number,
    religion: Number,
    sleightOfHands: Number,
    stealth: Number,
    survival: Number,
  },
});

const Character = mongoose.model("Character", userSchema);

module.exports = Character;
