import { combineReducers } from "redux";

import { fGame } from "./game";
import { fMenu } from "./menu";

const fSocket = (state, action) => {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'SOCKET READY') {
        return action.socket;
    }
    else if(action.type === 'SOCKET CLOSED') {
        return null;
    }

    return state;
};

export const fUiState = combineReducers({
    game: fGame,
    menu: fMenu,
    socket: fSocket
});
