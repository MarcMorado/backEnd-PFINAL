const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./db/schemas/User");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3001;
const { saveWeapon, connectToDb } = require("./db/services/mongodb");

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

io.on("connection", (socket) => {
  console.log("Un nuevo cliente se ha conectado");
  connectToDb();
  socket.on("createRoom", (roomCode) => {
    socket.join(roomCode);
    console.log(`Se ha creado una nueva sala con código: ${roomCode}`);
    io.emit("roomCreated", { roomCode: roomCode });
  });

  socket.on("joinRoom", (roomCode) => {
    socket.join(roomCode);
    console.log(`El usuario se ha unido a la sala con código: ${roomCode}`);
  });

  socket.on("roll", (data) => {
    console.log(data.user);
    console.log(data.roll);
    io.to(data.roomCode).emit("userRoll", data); // Emitir evento a todos los sockets en la misma sala
  });

  socket.on("newWeapon", (data) => {
    saveWeapon(data);
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

  // Verificar si el usuario ya existe en la base de datos
  User.findOne({ email })
    .then((user) => {
      if (user) {
        return res
          .status(400)
          .json({ message: "El correo electrónico ya está en uso" });
      }

      // Hash del password antes de almacenarlo en la base de datos
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);

      // Crear un nuevo usuario utilizando el modelo de Mongoose
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

  // Find the user by email
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res
          .status(401)
          .json({ message: "Correo electrónico o contraseña incorrectos" });
      }

      // Compare the password using bcrypt
      bcrypt.compare(password, user.password)
        .then((isMatch) => {
          if (!isMatch) {
            return res
              .status(401)
              .json({ message: "Correo electrónico o contraseña incorrectos" });
          }

          // Generate a JWT token
          const token = jwt.sign({ userId: user._id }, "secret_key");

          // Return the token to the client
          res.json({ token });
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

app.post("/character", (req, res) => {
  console.log(req.body);
  res.send({ data: "character received" });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
