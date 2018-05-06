
let sendActionsMiddleware = (socket) => (store => next => action => {
    let msg = null;

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
    else if(action.type === 'SEND HAND SELECT') {
        const gameState = store.getState().game;

        if(gameState.currentPhase === 'follow' && gameState.currentActor === 0) {
            store.dispatch({
                type: 'DEFEND CLICK',
                card: action.card
            });
        }
        else {
            // TODO: locally validate move more
            msg = {
                action: 'MOVE PUT',
                card: action.card
            };
        }
    }
    else if(action.type === 'SEND TABLE STACK CLICK') {
        const gameState = store.getState().game;

        if(gameState.defendMoveCard) {
            msg = {
                action: 'MOVE DEFEND',
                card: gameState.defendMoveCard,
                i_stack: action.iStack
            };

            store.dispatch({
                type: 'CANCEL DEFEND'
            });
        }
    }
    else if(action.type === 'SEND TAKE') {
        msg = {
            action: 'MOVE TAKE'
        };
    }
    else if(action.type === 'SEND END MOVE') {
        msg = {
            action: 'MOVE END'
        };

        store.dispatch({
            type: 'OPT TO END MOVE'
        });
    }

    if(msg !== null) {
        console.log("sending", msg);

        socket.send(JSON.stringify(msg));
    }

    next(action);
});

export { sendActionsMiddleware };
