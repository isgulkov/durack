import { createStore, applyMiddleware } from 'redux'; // React-redux
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { GameUI } from "./components/containers/ui";

import { fUiState } from "./store/ui";

import { sendActionsMiddleware } from "./middleware/sendActions";
import { processTimerActions } from "./middleware/processTimerActions";
import { processPlayerIdentity } from "./middleware/processPlayerIdentity";
import { filterWhenFrozen } from "./middleware/filterWhenFrozen";

// TODO: rewrite in socket.io or just implement reconnection (both sides)
let socket = new WebSocket('ws://localhost:8888/game');

let uiStore = createStore(
    fUiState,
    applyMiddleware(filterWhenFrozen, sendActionsMiddleware(socket), processTimerActions, processPlayerIdentity)
);

// uiStore.subscribe(() => console.log("state", uiStore.getState()));

ReactDOM.render(
    <Provider store={uiStore}>
        <GameUI/>
    </Provider>,
    document.getElementById('root')
);

uiStore.dispatch({
    type: 'SOCKET READY',
    socket: socket
});

socket.onmessage = (event) => {
    let action = JSON.parse(event.data);

    // console.log("From socket:", action);

    uiStore.dispatch(action);

    // console.log("Here's state after update:", uiStore.getState());
};

socket.onclose = (e) => {
    console.log("Socket closed for some fucking reason", e);

    uiStore.dispatch({
        type: 'SOCKET CLOSED'
    });
};

// TODO: actual reconnect after socket is closed

// TODO: a more interesting summary

// TODO: graphically show when the player is out of game himself

// TODO: Switch to ' in "symbols" and module names everywhere
// TODO: rework the state tree field names into something more sensible (after everything is done)

// TODO: persistent data about players between server restarts (a db)
// TODO: persistent data about players by username/password

// TODO: render server address into index.html ?

// TODO: naming: stack -> deck in state keys, camelcase in network dict keys, spotlight/actor, etc
// TODO: a non-random nomenclature of actions, state deltas, moves and ui clicks

// TODO: reconnect in menu
// TODO: persist game state across sessions
// TODO: private games by link

// TODO: split server state into more classes
// TODO: start writing unit tests for all of this

// TODO: ability to withdraw cards

// TODO: scale (separate lobby server, multiple game servers)
