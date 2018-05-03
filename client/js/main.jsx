'use strict';

import { createStore, applyMiddleware } from 'redux'; // React-redux
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import { ReprGameUI } from "./components/containers/ui";

import { fUiState } from "./store/ui";

import { sendActionsMiddleware } from "./middleware/sendActions";

// TODO: rewrite in socket.io or just implement reconnection (both sides)
let socket = new WebSocket('ws://localhost:8888/game');

let uiStore = createStore(fUiState, applyMiddleware(sendActionsMiddleware(socket)));

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
        var opponentHandCenters = getOpponentHandCenters(opponentHands.length + 1);

        for(var i = 0; i < opponentHands.length; i++) {
            this.save();

            var center = opponentHandCenters[i];

            var handSize = opponentHands[i].numCards;

            if(handSize !== 0) {
                var cardSpacing = Math.min(10, 100 / handSize);

                var handWidth = cardSpacing * (handSize - 1) + CARD_WIDTH;

                for(var j = handSize - 1; j >= 0; j--) {
                    this.drawCard('back', center.x - handWidth / 2 + cardSpacing * j, center.y - CARD_HEIGHT / 2);
                }
            }
            else {
                // TODO: find a better way to display this?

                this.save();

                this.beginPath();
                this.arc(center.x, center.y, 50, 0, 2 * Math.PI);
                this.closePath();

                this.globalAlpha = 0.4;

                this.fillStyle = 'gray';
                this.fill();

                this.restore();
            }

            // Draw nickname

            var nickname = opponentHands[i].nickname;

            this.font = '16px Helvetica, sans-serif';
            this.textAlign = 'center';
            this.textBaseline = 'middle';

            this.fillStyle = 'white';

            if(!opponentHands[i].inGame) {
                this.globalAlpha = 0.5;
            }

            var nicknameWidth = this.measureText(nickname).width;
            this.fillRect(
                center.x - nicknameWidth / 1.9 - 10,
                center.y + CARD_HEIGHT / 2 + 4,
                nicknameWidth + 20,
                20
            );

            this.fillStyle = 'black';

            this.fillText(
                nickname,
                center.x,
                center.y + CARD_HEIGHT / 2 + 14
            );

            this.restore();
        }
    };

    CanvasRenderingContext2D.prototype.drawLeftoverStack = function(stackSize, bottomCard) {
        var additionalOffset = 2 * Math.max(0, stackSize - 15);

        if(stackSize === 0) {
            this.save();

            this.globalCompositeOperation = 'darken';
        }

        this.drawCard(bottomCard, 50, 600 - CARD_HEIGHT - 25 - additionalOffset);

        if(stackSize === 0) {
            this.restore();
        }

        for(var i = stackSize - 1; i > 0; i--) {
            this.drawCard('back', 508 + 2 * i - additionalOffset, -135, true);
        }
    };

    CanvasRenderingContext2D.prototype.drawPlayedStack = function(stackSize) {
        stackSize = Math.min(30, stackSize);

        var cardSpacing = Math.min(10, 80 / stackSize);

        for(var i = 0; i < stackSize; i++) {
            this.drawCard('back', this.canvas.width - CARD_WIDTH - 5 - cardSpacing * i, this.canvas.height - CARD_HEIGHT + 10);
        }
    };

    CanvasRenderingContext2D.prototype.drawButton = function(text, message, x, y, width, height, color, fontSize,
                                                             textColor) {

    };

    CanvasRenderingContext2D.prototype.drawBigButton = function(text, message) {
        var x = (this.canvas.width - 200) / 2;
        var y = this.canvas.height - 200;

        var width = 200;
        var height = 40;

        this.drawButton(text, message, x, y, width, height);
    };

    CanvasRenderingContext2D.prototype.drawButtons = function(gameState) {
        if(gameState.currentPhase === 'follow' && gameState.currentActor === 0 && gameState.tableStacks.length !== 0) {
            this.drawBigButton("Забрать", {
                target: 'button take'
            });
        }
        else if((gameState.currentPhase === 'init' && gameState.currentActor === 0)
            || (!gameState.optedEndMove
                && gameState.currentPhase === 'follow' && gameState.currentActor !== 0)) {
            var putPossible = false;

            for(var i = 0; i < gameState.playerHand.length; i++) {
                var playerCard = gameState.playerHand[i];

                for(var j = 0; j < gameState.tableStacks.length; j++) {
                    var stack = gameState.tableStacks[j];

                    if(playerCard.rank === stack.top.rank) {
                        putPossible = true;
                        break;
                    }

                    if(stack.bottom !== null && playerCard.rank === stack.bottom.rank) {
                        putPossible = true;
                        break;
                    }
                }

                if(putPossible) {
                    break;
                }
            }

            if(putPossible) {
                this.drawBigButton("Закончить ход", {
                    target: 'button end move'
                });
            }
        }
    };

    CanvasRenderingContext2D.prototype.drawTimer = function(timer, currentPhase, currentActor) {
        console.log(timer);

        if(!timer) {
            return;
        }

        var minutes = Math.floor(timer.numSeconds / 60);
        var seconds = Math.floor(timer.numSeconds % 60);

        var text = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

        this.fillStyle = 'black';
        this.font = '32px serif';
        this.textAlign = 'center';
        this.textBaseline = 'middle';

        this.fillText(text, this.canvas.width / 2, this.canvas.height - 225);
    };

    CanvasRenderingContext2D.prototype.displayGameState = function(gameState) {
        this.clickAreas = [];

        if(gameState !== 'no game') {
            this.drawBackground(gameState.numPlayers, gameState.currentPhase, gameState.currentActor);

            this.drawPlayersHand(gameState.playerHand, gameState.defendMoveCard);

            this.drawCardsOnTable(gameState.tableStacks, gameState.defendMoveCard);

            this.drawOpponentHands(gameState.opponents);

            this.drawLeftoverStack(gameState.leftoverStackSize, gameState.bottomCard);

            this.drawPlayedStack(gameState.playedStackSize);

            this.drawButtons(gameState);

            this.drawTimer(gameState.timer, gameState.currentPhase, gameState.currentActor);

            // TODO: move out of this method, assign once

            var ctx = this;

            this.canvas.onclick = function(e) {
                var x = e.pageX - this.offsetLeft;
                var y = e.pageY - this.offsetTop;

                for(var i = ctx.clickAreas.length - 1; i >= 0; i--) {
                    var area = ctx.clickAreas[i];

                    if(x >= area.x && y >= area.y && x <= area.x + area.w && y <= area.y + area.h) {
                        if(ctx.clickHandlers !== undefined) {
                            ctx.clickHandlers.forEach(function(handler) {
                                handler(area.message);
                            });
                        }

                        break;
                    }
                }
            }
        }
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
