
let sendActionsMiddleware = (socket) => (store => next => action => {
    let msg = null;

    console.log("a", action);

    if(action.type === 'SEND FIND GAME') {
        msg = {
            action: 'FIND GAME'
        };
    }
    else if(action.type === 'SEND STOP LOOKING') {
        msg = {
            action: 'CANCEL FIND GAME'
        };
    }
    else if(action.type === 'SEND SET NICKNAME') {
        msg = {
            action: 'SET NICKNAME',
            newNickname: action.newNickname
        }
    }

    if(msg !== null) {
        console.log("sending", msg);

        socket.send(JSON.stringify(msg));
    }

    next(action);
});

export { sendActionsMiddleware };
