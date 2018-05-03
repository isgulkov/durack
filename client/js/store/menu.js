import { combineReducers } from "redux";

let fDisplayed = function(state, action) {
    if(state === undefined) {
        return true;
    }

    if(action.type === 'INITIALIZE GAME') {
        return false;
    }
    else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
        return true;
    }

    return state;
};

let fStatus = function(state, action) {
    if(state === undefined) {
        return 'initial';
    }

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

    return state;
};

let fNumLooking = function(state, action) {
    if(state === undefined) {
        return NaN;
    }

    if(action.type === 'UPDATE NUM LOOKING FOR GAME') {
        return action.num;
    }

    return state;
};

let fCurrentNickname = function(state, action) {
    if(state === undefined) {
        return "Игрок"; // TODO: magic value
    }

    if(action.type === 'CONFIRM SET NICKNAME') {
        return action.newNickname;
    }

    return state;
};

let fNicknamePrompt = function(state, action) {
    if(state === undefined) {
        return "";
    }

    if(action.type === 'CLICK SET NICKNAME' && state === "") {
        return uiStore.getState().menu.currentNickname;
    }
    else if(action.type === 'CONFIRM SET NICKNAME') {
        return "";
    }

    return state;
};

let fChangingNickname = function(state, action) {
    if(state === undefined) {
        return false;
    }

    if(action.type === 'CLICK SET NICKNAME') {
        return true;
    }
    else if(action.type === 'CONFIRM SET NICKNAME') {
        return false;
    }

    return state;
};

let fMenu = combineReducers({
    displayed: fDisplayed,
    status: fStatus,
    numLooking: fNumLooking,
    currentNickname: fCurrentNickname,
    nicknamePrompt: fNicknamePrompt,
    changingNickname: fChangingNickname
});

export { fMenu };
