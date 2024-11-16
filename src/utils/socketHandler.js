import verifyAccessTokenForSocket from "./verifyAccessTokenForSocket.js";
import generateGameId from "./generateGameId.js";
import checkWinner from "./checkWinner.js";

let games = {};
let activeGames = {};

setInterval(() => {
    const now = Date.now();
    for (const gameId in activeGames) {
        if (now - activeGames[gameId].createdAt > 10 * 60 * 1000) {
            console.log(`Game ID ${gameId} expired due to inactivity`);
            delete activeGames[gameId];
        }
    }
}, 60 * 1000);

const socketHandler = (io) => {
    io.on("connection", (socket) => {
        socket.on("createGame", async ({ accessToken }, callback) => {
            const userId = await verifyAccessTokenForSocket(accessToken);
            if (!userId) {
                return callback({ error: true, message: "Access Token Error" });
            }
            const gameId = generateGameId(activeGames);
            activeGames[gameId] = {
                createdAt: Date.now(),
                players: [{ userId, role: null }]
            };
            socket.join(gameId);
            callback(gameId);
        });

        // Join a game room
        socket.on("joinGame", async ({ accessToken, gameId }, callback) => {
            const userId = await verifyAccessTokenForSocket(accessToken);
            if (!userId) {
                return callback({ error: true, message: "Access Token Error" });
            }

            const game = activeGames[gameId];
            if (!game) {
                return callback({
                    success: false,
                    message: "Game ID does not exist or is inactive"
                });
            }

            if (game.players.length >= 2) {
                return callback({
                    success: false,
                    message: "Game already has two players"
                });
            }

            socket.join(gameId);
            game.players.push({ userId, role: null });

            if (game.players.length === 2) {
                const roles = ["X", "O"];
                const randomIndex = Math.floor(Math.random() * 2);
                game.players[0].role = roles[randomIndex];
                game.players[1].role = roles[1 - randomIndex];

                games[gameId] = {
                    board: Array(9).fill(null),
                    currentPlayer: game.players.find(
                        (player) => player.role === "O"
                    ).userId,
                    players: game.players
                };

                io.to(gameId).emit("gameStart", { players: game.players });
                delete activeGames[gameId];
            }

            callback({ success: true, message: "Joined game successfully" });
        });

        // Handle a move
        socket.on("makeMove", async ({ accessToken, gameId, index }) => {
            const userId = await verifyAccessTokenForSocket(accessToken);
            if (!userId) {
                return;
            }

            const game = games[gameId];
            if (!game || game.board[index] !== null) {
                return;
            }

            const player = game.players.find((p) => p.userId === userId);
            if (!player) {
                return;
            }

            if (game.currentPlayer !== userId) {
                return;
            }

            game.board[index] = player.role;

            const nextPlayer = game.players.find((p) => p.userId !== userId);
            game.currentPlayer = nextPlayer.userId;

            const winner = checkWinner(game.board);
            if (winner) {
                io.to(gameId).emit("gameOver", {
                    winner: winner === "X" || winner === "O" ? userId : "Draw"
                });
                delete games[gameId];
            } else if (!game.board.includes(null)) {
                io.to(gameId).emit("gameOver", { winner: "Draw" });
                delete games[gameId];
            } else {
                io.to(gameId).emit("gameUpdate", game);
            }
        });

        // Disconnect
        // socket.on("disconnect", () => {
        // console.log('User disconnected:', socket.id);
        // });
    });
};

export default socketHandler;
