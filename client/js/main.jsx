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


// TODO: a more interesting summary

// TODO: initialize state right on open
// TODO: for when after a server that he had an large state with, the client reconnects to a server that first sees him

// TODO: graphically show when the player is out of game himself

// TODO: Switch to ' in "symbols" and module names everywhere
// TODO: rework the state tree field names into something more sensible (after everything is done)

// TODO: persistent data about players between server restarts (a db)
// TODO: persistent data about players by username/password

// TODO: render server address into index.html ?

// TODO: naming: camelcase in network dict keys, spotlight/actor, etc
// TODO: a non-random nomenclature of actions, state deltas, moves and ui clicks

// TODO: leave game from in-game menu

// TODO: reconnect in menu
// TODO: persist game state across sessions
// TODO: private games by link

// TODO: split server state into more classes
// TODO: start writing unit tests for all of this

// TODO: ability to withdraw cards

// TODO: scale (separate lobby server, multiple game servers)
