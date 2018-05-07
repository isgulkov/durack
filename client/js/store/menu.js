import { combineReducers } from "redux";

const fDisplayed = (state=true, action) => {
    if(action.type === 'INITIALIZE GAME') {
        return false;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return true;
    }

    return state;
};

const fStatus = (state='initial', action) => {
    if(action.type === 'LOOKING FOR GAME') {
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

const fNumLooking = (state=NaN, action) => {
    if(action.type === 'UPDATE NUM LOOKING FOR GAME') {
        return action.num;
    }

    return state;
};

const fCurrentNickname = (state="", action) => {
    if(action.type === 'CONFIRM SET NICKNAME') {
        return action.newNickname;
    }

    return state;
};

const fChangingNickname = (state=false, action) => {
    if(action.type === 'CLICK CHANGE NICKNAME') {
        return true;
    }
    else if(action.type === 'CONFIRM SET NICKNAME') {
        return false;
    }

    return state;
};

const fEndSummary = (state=null, action) => {
    if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return {
            'loserNickname': action.loserNickname,
            'isLoser': action.loserIsYou
        }
    }
    else if(action.type === 'QUIT FROM GAME') {
        return null;
    }

    return state;
};

export const fMenu = combineReducers({
    displayed: fDisplayed,
    status: fStatus,
    numLooking: fNumLooking,
    currentNickname: fCurrentNickname,
    changingNickname: fChangingNickname,
    endSummary: fEndSummary
});
