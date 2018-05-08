
const createMoveTickInterval = (store) => {
    return setInterval(() => {
        store.dispatch({
            type: 'TIMER TICK'
        });
    }, 1000);
};

const createDisconnectTickInteval = (store, iPlayer) => {
    return setInterval(() => {
        store.dispatch({
            type: 'DISCONNECT TICK',
            iPlayer: iPlayer
        });
    }, 1000);
};

export const processTimerActions = (store => next => action => {
    if(action.type === 'STATE DELTA' && action.change === 'SET TIMER') {
        action.newInterval = createMoveTickInterval(store);
    }
    else if(action.type === 'PLAYER DISCONNECTED') {
        action.interval = createDisconnectTickInteval(store, action.iPlayer)
    }
    else if(action.type === 'INITIALIZE GAME') {
        // Restore the `setInterval`s on an initState
        const moveTimer = action.initState.timer;

        if(moveTimer !== undefined) {
            clearInterval(moveTimer.interval);

            moveTimer.interval = createMoveTickInterval(store);
        }

        // Object.keys(action.initState.playersDisconnected).forEach(iPlayer => {
        //     action.initState.playersDisconnected[iPlayer].interval = createDisconnectTickInteval(store, iPlayer)
        // });
    }

    next(action);
});
