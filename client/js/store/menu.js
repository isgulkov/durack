import { combineReducers } from "redux";

const fIsDisplayed = (state=true, action) => {
    if(action.type === 'init-player(initial)') {
        return true;
    }
    else if(action.type === 'INITIALIZE GAME') {
        return false;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return true;
    }

    return state;
};

const fStatus = (state='initial', action) => {
    if(action.type === 'init-player(initial)') {
        return 'initial';
    }
    else if(action.type === 'init-player(looking-for-game)') {
        return 'looking';
    }
    else if(action.type === 'STOPPED LOOKING FOR GAME') {
        return 'initial';
    }
    else if(action.type === 'INITIALIZE GAME') {
        return 'in game';
    }
    else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return 'game end';
    }
    else if(action.type === 'QUIT FROM GAME') {
        return 'initial';
    }

    return state;
};

const fNumLooking = (state="?", action) => {
    if(action.type === 'init-player(looking-for-game)' || action.type === 'update-looking-for-game(num)') {
        return action.numLooking;
    }

    return state;
};

const fCurrentNickname = (state="", action) => {
    if(action.type === 'init-player(initial)') {
        return action.nickname;
    }
    else if(action.type === 'CONFIRM SET NICKNAME') {
        return action.newNickname;
    }

    return state;
};

const fChangingNickname = (state=false, action) => {
    if(action.type === 'init-player(initial)') {
        return false;
    }
    else if(action.type === 'CLICK CHANGE NICKNAME') {
        return true;
    }
    else if(action.type === 'CONFIRM SET NICKNAME') {
        return false;
    }

    return state;
};

const fEndSummary = (state=null, action) => {
    if(action.type === 'init-player(initial)') {
        return null;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return {
            loserNickname: action.loserNickname,
            isLoser: action.loserIsYou,
            orderWon: action.orderWon,
            iYou: action.iYou,
            orderDisconnected: action.orderDisconnected
        }
    }
    else if(action.type === 'QUIT FROM GAME') {
        return null;
    }

    return state;
};

export const fMenu = combineReducers({
    isDisplayed: fIsDisplayed,
    status: fStatus,
    numLooking: fNumLooking,
    currentNickname: fCurrentNickname,
    changingNickname: fChangingNickname,
    endSummary: fEndSummary
});
