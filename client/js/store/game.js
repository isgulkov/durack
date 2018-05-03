import { combineReducers } from "redux";

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
        return action.i_spotlight;
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

        mutatedState[action.i_stack].bottom = action.card;

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
            var decreasedState = state.slice(0);

            decreasedState[action.i_opponent].numCards -= 1;

            return decreasedState;
        }
        else if(action.change === 'ADD TO OPPONENT HAND') {
            var increasedState = state.slice(0);

            increasedState[action.i_opponent].numCards += action.numCards;

            return increasedState;
        }
        else if(action.change === 'PLAYER OUT OF GAME') {
            var outedState = state.slice(0); // TODO: these variable names...

            outedState[action.i_opponent].inGame = false;

            return outedState;
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
    console.log("fTimer", state, action);

    if(state === undefined) {
        return null;
    }

    if(action.type === 'TIMER TICK' && state !== null) {
        if(state.numSeconds === 0) {
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
            interval: setInterval(function() {
                console.log("will tick");

                uiStore.dispatch({
                    type: 'TIMER TICK'
                });
            }, 1000)
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
    }
    else if(action.type === 'OPT TO END MOVE') {
        return true;
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
    optedEndMove: fOptedEndMove
});

let fGame = function(state, action) {
    if(state === undefined) {
        return 'no game'; // TODO: move this into the game state (?) to have a proper reducer
    }

    if(action.type === 'INITIALIZE GAME') {
        return fGame(action.init_state, {type: NaN});
    }
    else if(state !== 'no game') {
        return fInitializedGame(state, action);
    }

    return state;
};

export { fGame };
