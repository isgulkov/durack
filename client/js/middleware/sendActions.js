
let sendActionsMiddleware = store => next => action => {
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

        if(gameState.currentPhase === 'follow' && gameState.iSpotlight === 0) {
            store.dispatch({
                type: 'DEFEND CLICK',
                card: action.card
            });
        }
        else {
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
                iStack: action.iStack
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
    else if(action.type === 'FINISH GAME') {
        msg = {
            action: 'FINISH GAME'
        };
    }

    if(msg !== null) {
        console.log("sending", msg);

        const socket = store.getState().socket;

        if(socket !== null) {
            socket.send(JSON.stringify(msg))
        }
    }

    next(action);
};

export { sendActionsMiddleware };
