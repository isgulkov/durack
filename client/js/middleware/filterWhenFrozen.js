
export const filterWhenFrozen = (store => next => action => {
    if(action.type === 'TIMER TICK' || action.type.substring(0, 5) === 'SEND ') {
        // Filter user actions and timer ticks out when the game has ended or is frozen due to a player disconnect

        if(store.getState().menu.status === 'game end') {
            return;
        }

        const gameState = store.getState().game;

        // TODO: replace with a less expensive check -- this is done very often
        if(gameState !== 'no game' && Object.keys(gameState.playersDisconnected).length !== 0) {
            return;
        }
    }


    next(action);
});
