const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./db/schemas/User");
const bodyParser = require("body-parser");
const Character = require("./db/schemas/Character");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3001;
const { saveWeapon, connectToDb } = require("./db/services/mongodb");
//! PARA SUBIR EL SERVER https://railway.app/
//TEST DB
mongoose.connect("mongodb+srv://Marc:1234@final.awdtnsf.mongodb.net/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// TEST SOCKETS
const io = require("socket.io")(3002, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let players = [];
io.on("connection", (socket) => {
  console.log("Un nuevo cliente se ha conectado");
  connectToDb();
  socket.on("createRoom", (roomCode) => {
    socket.join(roomCode);
    console.log(`Se ha creado una nueva sala con código: ${roomCode}`);
    io.emit("roomCreated", { roomCode: roomCode });
  });

  socket.on("joinRoom", (roomCode) => {
    if (players.length < 4) {
      socket.join(roomCode);
      console.log(`El usuario se ha unido a la sala con código: ${roomCode}`);
    } else {
      socket.disconnect();
    }
  });
  socket.on("roll", (data) => {
    console.log('El usuario: ',data.user, 'ha tirado ==>', (data.roll));
    io.emit("userRoll", data); // Emitir evento a todos los sockets en la misma sala
  });

  socket.on("selectCharacter", (playerCharacter) => {
    if (players.length < 4) {
      players.push(playerCharacter);
      io.emit("updatePlayers", players);    }
  });

  socket.on("newWeapon", (data) => {
    saveWeapon(data);
  });

  socket.on("exitRoom", (name) => {
    const index = players.findIndex((player) => player.charName === name);
    if (index !== -1) {
      players.splice(index, 1);
      io.emit("updatePlayers", players);
    }
    console.log("players restantes", players.length);
  });

  socket.on("disconnect", (name) => {
    console.log("user disconnected");
    const index = players.findIndex((player) => player.charName === name);
    if (index !== -1) {
      players.splice(index, 1);
      io.emit("updatePlayers", players);
    }
  });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.send();
});

app.post("/", (req, res) => {
  console.log(req.body);
  res.send();
});

app.post("/signup", (req, res) => {
  const { username, email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (user) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso" });
      }

      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      const newUser = new User({ username, email, password: hash });
      return newUser.save();
    })
    .then(() => {
      res
        .status(200)
        .json({ message: "El usuario ha sido creado exitosamente" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Ha ocurrido un error en el servidor" });
    });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ message: "Correo electrónico o contraseña incorrectos" });
      }

      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (!isMatch) {
            return res
              .status(401)
              .json({ message: "Correo electrónico o contraseña incorrectos" });
          }

          const token = jwt.sign({ userId: user._id }, "secret_key");

          // Guardar el ID del usuario en una variable
          const userId = user._id;
          const username = user.username;
          res.json({ token, userId, username });
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .json({ message: "Ha ocurrido un error en el servidor" });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Ha ocurrido un error en el servidor" });
    });
});

app.post("/createRoom", (req, res) => {
  const roomCode = req.body.roomCode;
  io.emit("createRoom", roomCode); // Emitir el evento a todos los clientes conectados
  console.log(`Se ha creado una nueva sala con código: ${roomCode}`);
  res.send({ roomCode: roomCode });
});

// app.post("/character", (req, res) => {
//   console.log(req.body);
//   res.send({ data: "character received" });
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

///GET PJ
app.get("/characters/:userId", (req, res) => {
  Character.find({ userId: req.params.userId })
    .then((characters) => {
      res.send(characters);
      console.log(req.params.userId);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("An error occurred");
    });
});

/// Guardar el PERSONAJE

app.post("/character", (req, res) => {
  const { character, userId } = req.body;

  const newCharacter = new Character({
    userId: character.userId,
    model: character.model,
    charName: character.charName,
    race: character.race,
    class: character.class,
    level: character.level,
    background: character.background,
    alignment: character.alignment,
    expPoints: character.expPoints,
    armorClass: character.armorClass,
    initiative: character.initiative,
    speed: character.speed,
    hitPoints: character.hitPoints,
    inspiration: character.inspiration,
    proficiencyBonus: character.proficiencyBonus,
    equipment: {
      armor: character.equipment.armor,
      weapon: character.equipment.weapon,
    },
    stats: {
      str: character.stats.str,
      dex: character.stats.dex,
      const: character.stats.const,
      int: character.stats.int,
      wis: character.stats.wis,
      char: character.stats.char,
    },
    savingThrows: {
      str: character.savingThrows.str,
      dex: character.savingThrows.dex,
      const: character.savingThrows.const,
      int: character.savingThrows.int,
      wis: character.savingThrows.wis,
      char: character.savingThrows.char,
    },
    skills: {
      acrobatics: character.skills.acrobatics,
      animalHandling: character.skills.animalHandling,
      arcana: character.skills.arcana,
      athletics: character.skills.athletics,
      deception: character.skills.deception,
      history: character.skills.history,
      insight: character.skills.insight,
      intimidation: character.skills.intimidation,
      investigation: character.skills.investigation,
      medicine: character.skills.medicine,
      nature: character.skills.nature,
      perception: character.skills.perception,
      performance: character.skills.performance,
      persuasion: character.skills.persuasion,
      religion: character.skills.religion,
      sleightOfHands: character.skills.sleightOfHands,
      stealth: character.skills.stealth,
      survival: character.skills.survival,
    },
  });

  newCharacter
    .save()
    .then((character) => {
      res.json({ message: "Personaje guardado con éxito", character });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Ha ocurrido un error en el servidor" });
    });
});
