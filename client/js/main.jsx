'use strict';

import { createStore, applyMiddleware } from 'redux'; // React-redux
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { ReprGameUI } from "./components/containers/ui";

import { fUiState } from "./store/ui";

import { sendActionsMiddleware } from "./middleware/sendActions";
import { processTimerAction } from "./middleware/processTimerAction";

// TODO: rewrite in socket.io or just implement reconnection (both sides)
let socket = new WebSocket('ws://localhost:8888/game');

let uiStore = createStore(
    fUiState,
    applyMiddleware(sendActionsMiddleware(socket), processTimerAction)
);

uiStore.subscribe(() => console.log("state", uiStore.getState()));

ReactDOM.render(
    <Provider store={uiStore}>
        <ReprGameUI/>
    </Provider>,
    document.getElementById('root')
);

uiStore.dispatch({
    type: 'SOCKET READY',
    socket: socket
});

socket.onmessage = function(event) {
    let action = JSON.parse(event.data);

    console.log("From socket:", action);

    uiStore.dispatch(action);

    // console.log("Here's state after update:", JSON.stringify(uiStore.getState()));
};


require('../img/cards.gif');

var cardSpritesImg = new Image();
cardSpritesImg.src = 'img/cards.gif';

// All the display code
(function() {

    CanvasRenderingContext2D.prototype.drawCardsOnTable = function(tableStacks, defendMoveCard) {

    };

    CanvasRenderingContext2D.prototype.drawOpponentHands = function(opponentHands) {

    };

    CanvasRenderingContext2D.prototype.drawLeftoverStack = function(stackSize, bottomCard) {

    };

    CanvasRenderingContext2D.prototype.drawPlayedStack = function(stackSize) {

    };

    CanvasRenderingContext2D.prototype.drawButton = function(text, message, x, y, width, height, color, fontSize,
                                                             textColor) {

    };

    CanvasRenderingContext2D.prototype.drawBigButton = function(text, message) {
    };

    CanvasRenderingContext2D.prototype.drawButtons = function(gameState) {

    };

    CanvasRenderingContext2D.prototype.drawTimer = function(timer, currentPhase, currentActor) {

    };
}());


var handleMenuUpdate = function() {
    // TODO: redo all this mess in react or just in some better way

    var menuState = uiStore.getState().menu;

    document.getElementById('menu_container').style.display = menuState.displayed ? 'block' : 'none';

    if(menuState.status === 'looking') {
        document.getElementById('message_looking_for_game').style.display = 'block';
        document.getElementById('num_looking_for_game').innerHTML = menuState.numLooking;
    }
    else {
        document.getElementById('message_looking_for_game').style.display = 'none';
    }

    document.getElementById('end_game_summary').style.display = (menuState.status === 'game end') ? 'block' : 'none';

    document.getElementById('nickname_display').style.display = menuState.changingNickname ? 'none' : 'inline';
    document.getElementById('nickname_display').innerHTML = menuState.currentNickname;

    document.getElementById('nickname_input').style.display = menuState.changingNickname ? 'inline' : 'none';
    document.getElementById('nickname_input').value = menuState.nicknamePrompt;

    document.getElementById('nickname_submit').style.display = menuState.changingNickname ? 'inline' : 'none';
    document.getElementById('change_nickname').style.display = menuState.changingNickname ? 'none' : 'inline';
};

var handleGameUpdate = function() {
    window.requestAnimationFrame(function(t) {
        handleGameUpdate.ctx.displayGameState(uiStore.getState().game);
    });
};

// uiStore.subscribe(handleMenuUpdate);
// uiStore.subscribe(handleGameUpdate);

var initializeProgram = function() {var canvas = document.getElementById('main_canvas');
    // var ctx = canvas.getContext('2d');
    //
    // var socket = new WebSocket('ws://localhost:8888/game');
    //
    // handleGameUpdate.ctx = ctx; // TODO: put somewhere else
    //
    // ctx.clickHandlers = []; // TODO: move somewhere else
    // ctx.clickHandlers.push(function(message) {
    //     if(uiStore.getState().menu.status === 'game end') {
    //         return;
    //     }
    //
    //     var gameState = uiStore.getState().game;
    //
    //     if(message.target === 'card in hand') {
    //         if(gameState.currentPhase === 'follow' && gameState.currentActor === 0) {
    //             console.log("dispatching defend click even though ", message);
    //
    //             uiStore.dispatch({
    //                 type: 'DEFEND CLICK',
    //                 card: message.data
    //             });
    //         }
    //         else {
    //             // TODO: locally validate move more
    //
    //             socket.send(JSON.stringify({
    //                 action: 'MOVE PUT',
    //                 card: message.data
    //             }));
    //         }
    //     }
    //     else if(message.target === 'button end move') {
    //         socket.send(JSON.stringify({
    //             action: 'MOVE END'
    //         }));
    //
    //         uiStore.dispatch({
    //             type: 'OPT TO END MOVE'
    //         })
    //     }
    //     else if(message.target === 'cancel defend move') {
    //         uiStore.dispatch({
    //             type: 'CANCEL DEFEND'
    //         })
    //     }
    //     else if(message.target === 'table stack') {
    //         if(gameState.defendMoveCard) {
    //             socket.send(JSON.stringify({
    //                 action: 'MOVE DEFEND',
    //                 card: gameState.defendMoveCard,
    //                 i_stack: message.data
    //             }))
    //         }
    //     }
    //     else if(message.target === 'button take') {
    //         socket.send(JSON.stringify({
    //             action: 'MOVE TAKE'
    //         }));
    //     }
    //
    //     console.log(message); // TODO: remove at some point
    // });
    //
    // window.requestAnimationFrame(function() {
    //     handleMenuUpdate();
    //     handleGameUpdate();
    // });
    //
    // document.getElementById('find_game').onclick = function() {
    //     socket.send(JSON.stringify({
    //         action: 'FIND GAME'
    //     }));
    // };
    //
    // document.getElementById('cancel_find_game').onclick = function() {
    //     socket.send(JSON.stringify({
    //         action: 'CANCEL FIND GAME'
    //     }));
    // };
    //
    // document.getElementById('change_nickname').onclick = function() {
    //     uiStore.dispatch({
    //         type: 'CLICK CHANGE NICKNAME'
    //     })
    // };
    //
    // document.getElementById('nickname_submit').onclick = function() {
    //     socket.send(JSON.stringify({
    //         action: 'SET NICKNAME',
    //         newNickname: document.getElementById('nickname_input').value
    //     }))
    // };
    //
    // socket.onmessage = function(event) {
    //     var action = JSON.parse(event.data);
    //
    //     console.log("From socket:", action);
    //
    //     uiStore.dispatch(action);
    //
    //     console.log("Here's state after update:", JSON.stringify(uiStore.getState()));
    // };

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
};

document.addEventListener('DOMContentLoaded', function() {
    cardSpritesImg.addEventListener('load', function() {
        initializeProgram();
    });
});
