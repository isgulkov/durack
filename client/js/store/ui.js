import { combineReducers, createStore } from "redux";

import { fGame } from "./game";
import { fMenu } from "./menu";

let fSocket = (state, action) => {
    if(state === undefined) {
        return null;
    }

    if(action.type === 'SOCKET READY') {
        return action.socket;
    }

    return state;
};

let fUiState = combineReducers({
    game: fGame,
    menu: fMenu,
    socket: fSocket
});

export { fUiState };