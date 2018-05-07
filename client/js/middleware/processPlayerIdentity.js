
export const processPlayerIdentity = (store => next => action => {
    if(action.type === 'ACCEPT NEW UID') {
        document.cookie = 'player-uid=' + action.uidCookie
    }

    next(action);
});
