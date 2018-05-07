import { createStore, applyMiddleware } from 'redux'; // React-redux
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { GameUI } from "./components/containers/ui";

import { fUiState } from "./store/ui";

import { sendActionsMiddleware } from "./middleware/sendActions";
import { processTimerAction } from "./middleware/processTimerAction";

// TODO: rewrite in socket.io or just implement reconnection (both sides)
let socket = new WebSocket('ws://localhost:8888/game');

document.socket = socket;

let uiStore = createStore(
    fUiState,
    applyMiddleware(sendActionsMiddleware(socket), processTimerAction)
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

// TODO: cursors

// TODO: register vote for "end move" when "End move" is pressed by the init player to end init
// TODO: deregister vote for "end move" only when new move ops arise?

// TODO: don't show "Take" where every stack is beaten

// TODO: move timer
// TODO: end game summary

// TODO: render server address into index.html
// TODO: auto end move during follow when defending player all out of cards

// TODO: fix table stack buttons sometimes not disappearing after defend move
// TODO: naming: stack -> deck in state keys, camelcase in network dict keys, spotlight/actor, etc

// TODO: reconnect in menu
// TODO: persist game state across sessions
// TODO: private games by link

// TODO: split JS into ES6 modules (using Babel?)
// TODO: split server state into more classes
// TODO: start writing unit tests for all of this

// TODO: ability to withdraw cards

// TODO: switch to binary (think how to do this while maintaining readability)
// TODO: scale (separate lobby server, multiple game servers)

