function generateGameId(activeGames) {
    let gameId;
    do {
        gameId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (activeGames[gameId]);
    return gameId;
}

export default generateGameId;
