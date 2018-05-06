
export const processTimerAction = (store => next => action => {
    if(action.type === 'STATE DELTA' && action.change === 'SET TIMER') {
        action.newInterval = setInterval(function() {
            console.log("will tick");

            store.dispatch({
                type: 'TIMER TICK'
            });
        }, 1000);
    }

    next(action);
});
