/**
 * Created by frnkymac on 14/9/17.
 */

'use strict';

var cardSpritesImg = new Image();
cardSpritesImg.src = 'img/cards.gif';

// All the display code
(function() {
    var CARD_WIDTH = 72;
    var CARD_HEIGHT = 100;

    var getCardSpriteOffset = function(card) {
        if(card === 'back') {
            return {
                x: 5 * CARD_WIDTH,
                y: 4 * CARD_HEIGHT
            }
        }
        else {
            var y = CARD_HEIGHT * ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(card.suit);
            var x = CARD_WIDTH * ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(card.rank);

            return {
                x: x,
                y: y
            }
        }
    };

    var getOpponentHandCenters = (function() {
        var allCenters = [
            {x: 100, y: 325},
            {x: 125, y: 150},
            {x: 300, y: 75},
            {x: 500, y: 75},
            {x: 700, y: 75},
            {x: 1000 - 125, y: 150},
            {x: 1000 - 100, y: 325}
        ];

        return function(numPlayers) {
            switch(numPlayers) {
                case 2:
                    return [allCenters[3]];
                case 3:
                    return [allCenters[1], allCenters[5]];
                case 4:
                    return [allCenters[0], allCenters[3], allCenters[6]];
                case 5:
                    return [allCenters[0], allCenters[2], allCenters[4], allCenters[6]];
                case 6:
                    return [allCenters[0], allCenters[1], allCenters[3], allCenters[5], allCenters[6]];
                default:
                    window.alert("shit");
            }
        };
    }());

    CanvasRenderingContext2D.prototype.drawBackground = function(numPlayers, currentPhase, currentActor) {
        var grad = this.createLinearGradient(0, 0, 0, 600);

        grad.addColorStop(0.0, '#afa');
        grad.addColorStop(0.75, '#0c0');
        grad.addColorStop(1.0, '#070');

        this.fillStyle = grad;

        // Windows Solitaire bg color
        // this.fillStyle = '#008000';

        this.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if(currentActor !== undefined) {
            this.save();

            this.globalAlpha = 0.5;

            if(currentPhase === 'init') {
                this.globalCompositeOperation = 'overlay';

                this.fillStyle = '#fffacd';
            }
            else if(currentPhase === 'follow') {
                this.globalCompositeOperation = 'color';

                this.fillStyle = '#ff0000';
            }

            this.beginPath();

            if(currentActor === 0) {
                this.arc(this.canvas.width / 2, this.canvas.height + 300, 500, 0, Math.PI, true);
            }
            else {
                var opponentCenters = getOpponentHandCenters(numPlayers);

                var center = opponentCenters[currentActor - 1];

                this.arc(center.x, center.y, 100, 0, 2 * Math.PI);
            }

            this.closePath();
            this.fill();

            this.restore();
        }
    };

    CanvasRenderingContext2D.prototype.drawCard = function(card, x, y, horizontal) {
        var offset = getCardSpriteOffset(card);

        if(horizontal) {
            this.save();

            this.rotate(Math.PI / 2);
        }

        this.drawImage(cardSpritesImg, offset.x, offset.y, CARD_WIDTH, CARD_HEIGHT, x, y, CARD_WIDTH, CARD_HEIGHT);

        if(horizontal) {
            this.restore();
        }
    };

    CanvasRenderingContext2D.prototype.drawPlayersHand = function(playerCards) {
        var cardSpacing = Math.min(600 / playerCards.length, CARD_WIDTH + 10);

        var handWidth = cardSpacing * (playerCards.length - 1) + CARD_WIDTH;

        var totalLeftOffset = (this.canvas.width - handWidth) / 2;

        for(var i = 0; i < playerCards.length; i++) {
            var xOffset = totalLeftOffset + cardSpacing * i;
            var yOffset = this.canvas.height - CARD_HEIGHT - 50;

            this.drawCard(playerCards[i], xOffset, yOffset);

            this.clickAreas.push({
                x: xOffset,
                y: yOffset,
                w: CARD_WIDTH,
                h: CARD_HEIGHT,
                message: {
                    target: 'card',
                    data: playerCards[i]
                }
            });
        }
    };

    CanvasRenderingContext2D.prototype.drawCardsOnTable = function(tableStacks) {
        var stackSpacing = Math.min(CARD_WIDTH + 20, (550 - CARD_WIDTH) / tableStacks.length);

        var totalLeftOffset = (this.canvas.width - stackSpacing * (tableStacks.length)) / 2;
        var topOffset = 225;

        for(var i = 0; i < tableStacks.length; i++) {
            this.drawCard(tableStacks[i].top, totalLeftOffset + (stackSpacing) * i, topOffset);

            if(tableStacks[i].bottom !== undefined) {
                this.drawCard(
                    tableStacks[i].bottom,
                    totalLeftOffset + 5 + (stackSpacing) * i,
                    topOffset + CARD_HEIGHT / 2
                );
            }
        }
    };

    CanvasRenderingContext2D.prototype.drawOpponentHands = function(opponentHands) {
        var opponentHandCenters = getOpponentHandCenters(opponentHands.length + 1);

        for(var i = 0; i < opponentHands.length; i++) {
            var center = opponentHandCenters[i];
            var handSize = opponentHands[i].numCards;

            var cardSpacing = Math.min(10, 100 / handSize);

            var handWidth = cardSpacing * (handSize - 1) + CARD_WIDTH;

            for(var j = handSize - 1; j >= 0; j--) {
                this.drawCard('back', center.x - handWidth / 2 + cardSpacing * j, center.y - CARD_HEIGHT / 2);
            }

            var nickname = opponentHands[i].nickname;

            this.save();

            this.font = '16px Helvetica, sans-serif';

            var nicknameMetrics = this.measureText(nickname);

            this.fillStyle = 'white';

            this.fillRect(
                center.x - nicknameMetrics.width / 1.9 - 10,
                center.y + CARD_HEIGHT / 2 + 4,
                nicknameMetrics.width + 20,
                20
            );

            this.fillStyle = 'black';

            this.fillText(
                nickname,
                center.x - nicknameMetrics.width / 1.9,
                center.y + CARD_HEIGHT / 2 + 18
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

    CanvasRenderingContext2D.prototype.displayGameState = function(gameState) {
        this.clickAreas = [];

        if(gameState !== 'no game') {
            this.drawBackground(gameState.numPlayers, gameState.currentPhase, gameState.currentActor);

            this.drawPlayersHand(gameState.playerHand);

            this.drawCardsOnTable(gameState.tableStacks);

            this.drawOpponentHands(gameState.opponents);

            this.drawLeftoverStack(gameState.leftoverStackSize, gameState.bottomCard);

            this.drawPlayedStack(gameState.playedStackSize);

            // TODO: move out of this method, assign once

            var ctx = this;

            this.canvas.onclick = function(e) {
                var x = e.clientX - this.offsetLeft;
                var y = e.clientY - this.offsetTop;

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

var uiStore = (function() {
    var fGame = function(state, action) {
        if(state === undefined) {
            return 'no game'
        }

        if(action.type === 'INITIALIZE GAME') {
            return action.init_state;
        }

        if(action.type === 'COME ON IT') {
            var phase = state.currentPhase, actor = state.currentActor;

            if(phase === 'init') {
                phase = 'follow';

                actor += 1;
                actor %= state.numPlayers;
            }
            else {
                phase = 'init'
            }

            return Object.assign({}, state, {
                currentPhase: phase,
                currentActor: actor
            });
        }

        return state;
    };

    var fMenu = function() {
        var fDisplayed = function(state, action) {
            if(state === undefined) {
                return true;
            }

            if(action.type === 'INITIALIZE GAME') {
                return false;
            }

            return state;
        };

        var fStatus = function(state, action) {
            if(state === undefined) {
                return 'initial';
            }

            if(action.type === 'LOOKING FOR GAME') {
                return 'looking';
            }
            else if(action.type === 'STOPPED LOOKING FOR GAME') {
                return 'initial';
            }
            if(action.type === 'INITIALIZE GAME') {
                return 'in game';
            }

            return state;
        };

        var fNumLooking = function(state, action) {
            if(state === undefined) {
                return NaN;
            }

            if(action.type === 'UPDATE NUM LOOKING FOR GAME') {
                return action.num;
            }

            return state;
        };

        return Redux.combineReducers({
            displayed: fDisplayed,
            status: fStatus,
            numLooking: fNumLooking
        })
    }();

    var fUiState = Redux.combineReducers({
        game: fGame,
        menu: fMenu
    });

    return Redux.createStore(fUiState);
}());

var handleMenuUpdate = function() {
    var menuState = uiStore.getState().menu;

    document.getElementById('menu_container').style.display = menuState.displayed ? 'block' : 'none';

    if(menuState.status === 'looking') {
        document.getElementById('message_looking_for_game').style.display = 'block';
        document.getElementById('num_looking_for_game').innerHTML = menuState.numLooking;
    }
    else {
        document.getElementById('message_looking_for_game').style.display = 'none';
    }
};

var handleGameUpdate = function() {
    window.requestAnimationFrame(function(t) {
        handleGameUpdate.ctx.displayGameState(uiStore.getState().game);
    });
};

uiStore.subscribe(handleMenuUpdate);
uiStore.subscribe(handleGameUpdate);

var initializeProgram = function() {var canvas = document.getElementById('main_canvas');
    var ctx = canvas.getContext('2d');

    var socket = new WebSocket('ws://localhost:8888/game');

    handleGameUpdate.ctx = ctx; // TODO: put somewhere else

    ctx.clickHandlers = []; // TODO: move somewhere else
    ctx.clickHandlers.push(function(message) {
        console.log(message);
    });

    window.requestAnimationFrame(function() {
        handleMenuUpdate();
        handleGameUpdate();
    });

    document.getElementById('find_game').onclick = function() {
        socket.send(JSON.stringify({
            action: 'FIND GAME'
        }));
    };

    document.getElementById('cancel_find_game').onclick = function() {
        socket.send(JSON.stringify({
            action: 'CANCEL FIND GAME'
        }));
    };

    socket.onmessage = function(event) {
        var action = JSON.parse(event.data);

        uiStore.dispatch(action);
    };

    // TODO: process clicks
    // TODO: issue moves

    // TODO: nickname choice
    // TODO: move timer

    // TODO: terminology in state keys: stack -> deck
    // TODO: restructure with ES6 imports using Babel
};

document.addEventListener('DOMContentLoaded', function() {
    cardSpritesImg.addEventListener('load', function() {
        initializeProgram();
    });
});
