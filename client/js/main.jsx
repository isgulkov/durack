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


// TODO: fix the calculation of winner in the case where there aren't 1 player left (both spend all cards in a final exchange
// TODO: don't show "End move" button where there's no option to continue the 'init' move

// TODO: store messages for player in a queue while he's disconnected and then replay ?

// TODO: auto-take when 1x1, unbeatable and no more puts

// TODO: better random nicknames

// TODO: initialize on open any state, not just the 'game' part
// TODO: for when after a server that he had an large state with, the client reconnects to a server that first sees him

// TODO: even richer game stats and player stats

// TODO: graphically show when the player is out of game himself

// TODO: Switch to ' in "symbols" and module names everywhere

// TODO: persistent data about players between server restarts (a db)
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
