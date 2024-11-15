import express from "express";
import noRouteController from "../controllers/noRouteController.js";
import { errorMiddleware } from "../errors/errorMiddlewares/index.js";

const router = express.Router();

router.get("/ping", (_, res) => {
    res.send({ pong: "Hello from the Tic Tac Toe Service" });
});

router.all("*", noRouteController);

router.use(errorMiddleware);

export default router;
