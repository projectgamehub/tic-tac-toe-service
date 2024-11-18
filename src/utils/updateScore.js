import axios from "axios";
import { GAMES_SERVICE_URL, TIC_TAC_TOE_GAME_ID } from "../config/index.js";

const updateScore = (winnerUserId) => {
    axios
        .patch(`${GAMES_SERVICE_URL}add-match-score`, {
            gameId: TIC_TAC_TOE_GAME_ID,
            score: 10,
            userId: winnerUserId
        })
        .catch((e) => {
            // Error ignored
        });
};

export default updateScore;
