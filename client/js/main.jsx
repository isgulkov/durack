import { createStore, applyMiddleware } from 'redux';
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { GameUI } from "./components/containers/ui";

import { fUiState } from "./store/ui";

import { sendActionsMiddleware } from "./middleware/sendActions";
import { processTimerActions } from "./middleware/processTimerActions";
import { processPlayerIdentity } from "./middleware/processPlayerIdentity";
import { filterWhenFrozen } from "./middleware/filterWhenFrozen";
import { socketMaintenance } from "./middleware/socketMaintenance";


let uiStore = createStore(
    fUiState,
    applyMiddleware(
        socketMaintenance,
        filterWhenFrozen,
        sendActionsMiddleware,
        processTimerActions,
        processPlayerIdentity
    )
);

// uiStore.subscribe(() => console.log("state", uiStore.getState()));

ReactDOM.render(
    <Provider store={uiStore}>
        <GameUI/>
    </Provider>,
    document.getElementById('root')
);

uiStore.dispatch({
    type: 'INIT SOCKET'
});


// TODO: deal with the problem of spotty sockets by grouping messages into queues

// TODO: fix the calculation of winner in the case where there aren't 1 player left (both spend all cards in a final exchange)

// TODO: solve the mystery of game coming to an end really quick when everybody is disconnected

// TODO: store messages for player in a queue while he's disconnected and then replay ?

// TODO: better random nicknames

// TODO: auto-take when 1x1, unbeatable and no more puts ?

// TODO: even richer game stats and player stats

// TODO: graphically show when the player is out of game himself

// TODO: Switch to ' in "symbols" and module names everywhere

// TODO: persistent data about players by username/password

// TODO: leave game from in-game menu

// TODO: render server address into index.html ?

// TODO: a non-random nomenclature of actions, state deltas, moves and ui clicks
// TODO: rework the state tree field names

// TODO: persist game state across sessions
// TODO: private games by link

// TODO: split server state into more classes
// TODO: start writing unit tests for all of this

// TODO: ability to withdraw cards

// TODO: scale (separate lobby server, multiple game servers)
