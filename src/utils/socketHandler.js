import verifyAccessTokenForSocket from "./verifyAccessTokenForSocket.js";
import generateGameId from "./generateGameId.js";
import checkWinner from "./checkWinner.js";
import updateScore from "./updateScore.js";

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
    for (const gameId in games) {
        if (now - games[gameId].createdAt > 10 * 60 * 1000) {
            console.log(`Game ID ${gameId} expired due to inactivity`);
            delete games[gameId];
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
                players: [{ userId, role: null, readyForRematch: false }]
            };
            socket.join(gameId);
            callback(gameId);
        });

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
            game.players.push({ userId, role: null, readyForRematch: false });

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
                    players: game.players,
                    createdAt: Date.now()
                };

                io.to(gameId).emit("gameStart", { players: game.players });
                delete activeGames[gameId];
            }

            callback({ success: true, message: "Joined game successfully" });
        });

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
            io.to(gameId).emit("gameUpdate", game);
            if (winner) {
                io.to(gameId).emit("gameOver", {
                    winner: winner === "X" || winner === "O" ? userId : "Draw"
                });
                if (winner === "X" || winner === "O") {
                    updateScore(userId);
                }
            } else if (!game.board.includes(null)) {
                io.to(gameId).emit("gameOver", { winner: "Draw" });
            }
        });

        socket.on("closeLobby", async ({ accessToken, gameId }) => {
            const userId = await verifyAccessTokenForSocket(accessToken);
            if (!userId) {
                return;
            }

            const game = activeGames[gameId] || games[gameId];
            if (!game) {
                return;
            }

            if (game.players[0]?.userId !== userId) {
                return;
            }

            delete activeGames[gameId];
            delete games[gameId];
        });

        socket.on("requestRematch", async ({ accessToken, gameId }) => {
            const userId = await verifyAccessTokenForSocket(accessToken);
            if (!userId) return;

            const game = games[gameId];
            if (!game) return;

            const player = game.players.find((p) => p.userId === userId);
            if (!player) return;

            player.readyForRematch = true;

            if (game.players.every((p) => p.readyForRematch)) {
                game.board = Array(9).fill(null);
                game.players.forEach((p) => (p.readyForRematch = false));
                game.currentPlayer = game.players.find(
                    (p) => p.role === "O"
                ).userId;
                game.createdAt = Date.now();

                io.to(gameId).emit("gameStart", { players: game.players });
            }
        });

        // Disconnect
        // socket.on("disconnect", () => {
        // console.log('User disconnected:', socket.id);
        // });
    });
};

export default socketHandler;
