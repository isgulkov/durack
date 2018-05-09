
const createMoveTickInterval = (store) => {
    /*
    This is where all these move timer intervals are created and this is where they are cleared.

    TODO: don't do setInterval each time the timer is reset, just have a permanent, more granular one?
     */

    if(window.hasOwnProperty('___durack_move_interval')) {
        clearInterval(window.___durack_move_interval)
    }

    const newInterval = setInterval(() => {
        store.dispatch({
            type: 'TIMER TICK'
        });
    }, 1000);

    window.___durack_move_interval = newInterval;

    return newInterval;
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
    if(action.type === 'STATE DELTA' && action.change === 'timer-move-set') {
        action.newInterval = createMoveTickInterval(store);
    }
    else
    if(action.type === 'init-player(in-game)' || action.type === 'INITIALIZE GAME') {
        action.game.timer.interval = createMoveTickInterval(store);
    }
    else if(action.type === 'player-disconnected') {
        action.interval = createDisconnectTickInteval(store, action.iPlayer)
    }

    next(action);
});
