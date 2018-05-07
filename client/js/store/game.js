import { combineReducers } from "redux";

// TODO: redo this and other stores in let/const
// TODO: use default args in all reducers

let fNumPlayers = function(state, action) {
    if(state === undefined) {
        return null;
    }

    return state;
};

let fCurrentPhase = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'PHASE') {
        return action.phase;
    }

    return state;
};

let fCurrentActor = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'SPOTLIGHT') {
        console.log("new spotlight", action.iSpotlight);

        return action.iSpotlight;
    }

    return state;
};

let fPlayerHand = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'REMOVE FROM PLAYER HAND') {
        var strippedDownState = [];

        for(var i = 0; i < state.length; i++) {
            if(state[i].suit !== action.card.suit || state[i].rank !== action.card.rank) {
                strippedDownState.push(state[i]);
            }
        }

        return strippedDownState;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'ADD TO PLAYER HAND') {
        var amendedState = state.slice(0);

        action.cards.forEach(function(card) {
            amendedState.push(card);
        });

        return amendedState;
    }

    return state;
};

let fTableStacks = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'PUT ON TABLE') {
        var appendedState = state.slice(0);

        appendedState.push({
            'top': action.card,
            'bottom': null
        });

        return appendedState;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'PUT ONTO STACK') {
        var mutatedState = state.slice(0);

        mutatedState[action.iStack].bottom = action.card;

        return mutatedState;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'CLEAR TABLE') {
        return []
    }

    return state;
};

let fOpponents = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA') {
        if(action.change === 'REMOVE FROM OPPONENT HAND') {
            let newState = state.slice(0);

            newState[action.iOpponent].numCards -= 1;

            return newState;
        }
        else if(action.change === 'ADD TO OPPONENT HAND') {
            let newState = state.slice(0);

            newState[action.iOpponent].numCards += action.numCards;

            return newState;
        }
        else if(action.change === 'PLAYER OUT OF GAME' && action.iPlayer !== 0) {
            let newState = state.slice(0); // TODO: these variable names...

            newState[action.iPlayer - 1].inGame = false;

            return newState;
        }
    }

    return state;
};

let fLeftoverStackSize = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'REMOVE FROM DECK') {
        return state - action.numCards;
    }

    return state;
};

let fBottomCard = function(state, action) {
    if(state === undefined) {
        return null;
    }
    return state;
};

let fPlayedStackSize = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'STATE DELTA' && action.change === 'ADD TO PLAYED DECK') {
        return state + action.numCards;
    }

    return state;
};

let fDefendMoveCard = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'DEFEND CLICK') {
        return action.card;
    }
    else if(action.type === 'CANCEL DEFEND') {
        return null;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'PHASE') {
        return null;
    }

    return state;
};

let fTimer = function(state, action) {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'TIMER TICK' && state !== null) {
        if(state.numSeconds <= 0) {
            clearInterval(state.interval);

            return null;
        }
        else {
            return Object.assign({}, state, {
                numSeconds: state.numSeconds - 1
            });
        }
    }
    else if(action.type === 'STATE DELTA' && action.change === 'SET TIMER') {
        if(state !== null) {
            clearInterval(state.interval);
        }

        return {
            numSeconds: action.numSeconds,
            interval: action.newInterval
        }
    }

    return state;
};

let fOptedEndMove = function(state, action) {
    if(state === undefined) {
        return false;
    }

    if(action.type === 'STATE DELTA') {
        if(action.change === 'PUT ON TABLE' || action.change === 'PUT ONTO STACK' || action.change === 'PHASE') {
            return false;
        }
        else if(action.change === 'OPTED TO END MOVE') {
            return true;
        }
    }

    return state;
};

let fPlayersDisconnected = (state={}, action) => {
    if(action.type === 'PLAYER DISCONNECTED') {
        let newState = Object.assign({}, state);

        newState[action.iPlayer] = {
            secondsLeft: action.secondsLeft,
            interval: action.interval
        };

        return newState;
    }
    else if(action.type === 'DISCONNECT TICK') {
        let newState = Object.assign({}, state);

        newState[action.iPlayer].secondsLeft -= 1;

        return newState;
    }
    else if(action.type === 'PLAYER RECONNECTED' || action.type === 'PLAYER LEFT') {
        let newState = Object.assign({}, state);

        clearInterval(newState[action.iPlayer].interval);
        delete newState[action.iPlayer];

        return newState;
    }

    return state;
};

let fInitializedGame = combineReducers({
    numPlayers: fNumPlayers,
    currentPhase: fCurrentPhase,
    currentActor: fCurrentActor,
    playerHand: fPlayerHand,
    tableStacks: fTableStacks,
    opponents: fOpponents,
    leftoverStackSize: fLeftoverStackSize,
    bottomCard: fBottomCard,
    playedStackSize: fPlayedStackSize,
    defendMoveCard: fDefendMoveCard, // TODO: move these out of the game state (or rename the "game state"?)
    timer: fTimer,
    optedEndMove: fOptedEndMove,
    playersDisconnected: fPlayersDisconnected
});

let fGame = function(state, action) {
    if(state === undefined) {
        return 'no game'; // TODO: move this into the game state (?) to have a proper reducer
    }

    if(action.type === 'INITIALIZE GAME') {
        return fGame(action.initState, {type: NaN});
    }
    else if(action.type === 'CLICK FINISH GAME') {
        return 'no game';
    }
    else if(state !== 'no game') {
        return fInitializedGame(state, action);
    }

    return state;
};

export { fGame };
