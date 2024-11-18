import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const GAMES_SERVICE_URL = process.env.GAMES_SERVICE_URL;
const TIC_TAC_TOE_GAME_ID = process.env.TIC_TAC_TOE_GAME_ID;

export {
    PORT,
    NODE_ENV,
    USER_SERVICE_URL,
    GAMES_SERVICE_URL,
    TIC_TAC_TOE_GAME_ID
};
