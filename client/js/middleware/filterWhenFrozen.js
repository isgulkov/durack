
export const filterWhenFrozen = (store => next => action => {
    console.log("Received action", action);

    if(action.type === 'TIMER TICK' || action.type.substring(0, 5) === 'SEND ') {
        // Filter user actions and timer ticks out when the game has ended or is frozen due to a player disconnect

        if(store.getState().menu.status === 'game end') {
            return;
        }

        const gameState = store.getState().game;

        if(gameState !== 'no game' && Object.keys(gameState.playersDisconnected).length !== 0) {
            return;
        }
    }

    next(action);
});
