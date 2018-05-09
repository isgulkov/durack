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

