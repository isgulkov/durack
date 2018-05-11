
let sendActionsMiddleware = store => next => action => {
    let msg = null;

    // TODO: rearrange in order of descending frequency

    if(action.type === 'SEND FIND GAME') {
        msg = {
            kind: 'act-looking-for-game(start)'
        };
    }
    else if(action.type === 'SEND STOP LOOKING') {
        msg = {
            kind: 'act-looking-for-game(stop)'
        };
    }
    else if(action.type === 'send-set-nickname') {
        msg = {
            kind: 'set-nickname',
            newNickname: action.newNickname
        }
    }
    else if(action.type === 'send-set-mm-deck') {
        msg = {
            kind: 'set-mm-deck',
            deck: action.deck
        }
    }
    else if(action.type === 'send-set-mm-min-players') {
        msg = {
            kind: 'set-mm-min-players',
            minPlayers: action.minPlayers
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
                kind: 'move-put',
                card: action.card
            };
        }
    }
    else if(action.type === 'SEND TABLE STACK CLICK') {
        const gameState = store.getState().game;

        if(gameState.defendMoveCard) {
            msg = {
                kind: 'move-defend',
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
            kind: 'move-take'
        };
    }
    else if(action.type === 'SEND END MOVE') {
        msg = {
            kind: 'move-end'
        };

        store.dispatch({
            type: 'OPT TO END MOVE'
        });
    }
    else if(action.type === 'FINISH GAME') {
        msg = {
            kind: 'act-finish-game'
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
