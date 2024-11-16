import express from "express";
import { PORT } from "./config/index.js";
import cors from "cors";
import router from "./routes/index.js";
import { Server as SocketIO } from "socket.io";
import socketHandler from "./utils/socketHandler.js";

const app = express();

const initializeServer = () => {
    // TODO Configure this later
    app.use(cors());

    // TODO Add Limit on this
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    app.use("/", router);
};

const server = app.listen(PORT, async () => {
    initializeServer();
    console.log("Listening on port: ", PORT);
});

// TODO Configure this CORS later
const io = new SocketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

socketHandler(io);
