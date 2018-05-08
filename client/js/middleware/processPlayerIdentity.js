
export const processPlayerIdentity = (store => next => action => {
    if(action.type === 'ACCEPT NEW UID') {
        document.cookie = 'player-uid=' + action.encryptedUid + ';max-age=' + (60 * 60 * 24 * 30);
    }

    next(action);
});
