import { combineReducers } from "redux";

const fNumPlayers = (state=null, action) => {
    return state;
};

const fCurrentPhase = (state=null, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'PHASE') {
        return action.phase;
    }

    return state;
};

const fCurrentActor = (state=null, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'SPOTLIGHT') {
        console.log("new spotlight", action.iSpotlight);

        return action.iSpotlight;
    }

    return state;
};

const fPlayerHand = (state=null, action) => {
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

const fTableStacks = (state=null, action) => {
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

const fOpponents = (state=null, action) => {
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
            let newState = state.slice(0);

            newState[action.iPlayer - 1].inGame = false;

            return newState;
        }
    }

    return state;
};

const fLeftoverStackSize = (state=null, action) => {
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


const fPlayedStackSize = (state=null, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'ADD TO PLAYED DECK') {
        return state + action.numCards;
    }

    return state;
};

const fDefendMoveCard = (state=null, action) => {
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

const fTimer = (state=null, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
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

const fOptedEndMove = (state=false, action) => {
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

const fPlayersDisconnected = (state={}, action) => {
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
    else if(action.type === 'PLAYER RECONNECTED' || action.type === 'PLAYER TIMED OUT') {
        let newState = Object.assign({}, state);

        clearInterval(newState[action.iPlayer].interval);
        delete newState[action.iPlayer];

        return newState;
    }

    return state;
};

const fHasEnded = (state=false, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return true;
    }

    return state;
}

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
    defendMoveCard: fDefendMoveCard,
    timer: fTimer,
    optedEndMove: fOptedEndMove,
    playersDisconnected: fPlayersDisconnected,
    hasEnded: fHasEnded
});

export const fGame = function(state='no game', action) {
    if(action.type === 'INITIALIZE GAME') {
        return fGame(action.initState, {type: NaN});
    }
    else if(action.type === 'QUIT FROM GAME') {
        return 'no game';
    }
    else if(state !== 'no game') {
        return fInitializedGame(state, action);
    }

    return state;
};
