import { combineReducers, createStore } from "redux";

import { fGame } from "./game";
import { fMenu } from "./menu";

let fUiState = combineReducers({
    game: fGame,
    menu: fMenu
});

let uiStore = createStore(fUiState);

export { uiStore };
