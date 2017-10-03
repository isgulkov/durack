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

    CanvasRenderingContext2D.prototype.drawPlayersHand = function(playerCards, defendMoveCard) {
        var cardSpacing = Math.min(600 / playerCards.length, CARD_WIDTH + 10);

        var handWidth = cardSpacing * (playerCards.length - 1) + CARD_WIDTH;

        var totalLeftOffset = (this.canvas.width - handWidth) / 2;

        for(var i = 0; i < playerCards.length; i++) {
            var xOffset = totalLeftOffset + cardSpacing * i;
            var yOffset = this.canvas.height - CARD_HEIGHT - 50;

            var card = playerCards[i];

            this.drawCard(card, xOffset, yOffset);

            this.clickAreas.push({
                x: xOffset,
                y: yOffset,
                w: CARD_WIDTH,
                h: CARD_HEIGHT,
                message: {
                    target: 'card in hand',
                    data: playerCards[i]
                }
            });

            if(defendMoveCard && defendMoveCard.suit === card.suit && defendMoveCard.rank === card.rank) {
                this.drawButton(
                    "Отмена",
                    {
                        target: 'cancel defend move'
                    },
                    xOffset - 4,
                    yOffset - 4,
                    CARD_WIDTH + 8,
                    CARD_HEIGHT + 8,
                    'blue',
                    16,
                    'white'
                );
            }
        }
    };

    CanvasRenderingContext2D.prototype.drawCardsOnTable = function(tableStacks, defendMoveCard) {
        var stackSpacing = Math.min(CARD_WIDTH + 20, (550 - CARD_WIDTH) / tableStacks.length);

        var totalLeftOffset = (this.canvas.width - stackSpacing * (tableStacks.length)) / 2;
        var topOffset = 225;

        for(var i = 0; i < tableStacks.length; i++) {
            this.drawCard(tableStacks[i].top, totalLeftOffset + (stackSpacing) * i, topOffset);

            var bottomCardX = totalLeftOffset + 5 + (stackSpacing) * i;
            var bottomCardY = topOffset + CARD_HEIGHT / 2;

            if(tableStacks[i].bottom !== null) {
                this.drawCard(
                    tableStacks[i].bottom,
                    bottomCardX,
                    bottomCardY
                );
            }
            else if(defendMoveCard) {
                this.drawButton(
                    "",
                    {
                        target: 'table stack',
                        data: i
                    },
                    bottomCardX,
                    bottomCardY,
                    CARD_WIDTH,
                    CARD_HEIGHT,
                    'black'
                )
            }
        }
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
        this.save();

        this.globalAlpha = 0.4;

        this.fillStyle = color || 'white';
        this.fillRect(x, y, width, height);

        this.globalAlpha = 1.0;

        this.fillStyle = textColor || 'black';
        this.font = (fontSize || 24) + 'px Georgia, serif';
        this.textAlign = 'center';
        this.textBaseline = 'middle';

        this.fillText(
            text,
            x + width / 2,
            y + height / 2
        );

        this.clickAreas.push({
            x: x,
            y: y,
            w: width,
            h: height,
            message: message
        });

        this.restore();
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

var uiStore = (function() {
    var fNumPlayers = function(state, action) { if(state === undefined) { return null; } return state; };

    var fCurrentPhase = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA' && action.change === 'PHASE') {
            return action.phase;
        }

        return state;
    };

    var fCurrentActor = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA' && action.change === 'SPOTLIGHT') {
            return action.i_spotlight;
        }

        return state;
    };

    var fPlayerHand = function(state, action) {
        if(state === undefined) { return null; }

        if(action.type === 'STATE DELTA' && action.change === 'REMOVE FROM PLAYER HAND') {
            var strippedDownState = [];

            for(var i = 0; i < state.length; i++) {
                if(state[i].suit !== action.card.suit || state[i].rank !== action.card.rank) {
                    strippedDownState.push(state[i]);
                }
            }

            return strippedDownState;
        }
        else if(action.type === 'STATE DELTA' && action.change === 'ADD TO PLAYER HAND') {
            var amendedState = state.slice(0);

            action.cards.forEach(function(card) {
                amendedState.push(card);
            });

            return amendedState;
        }

        return state;
    };

    var fTableStacks = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA' && action.change === 'PUT ON TABLE') {
            var appendedState = state.slice(0);

            appendedState.push({
                'top': action.card,
                'bottom': null
            });

            return appendedState;
        }
        else if(action.type === 'STATE DELTA' && action.change === 'PUT ONTO STACK') {
            var mutatedState = state.slice(0);

            mutatedState[action.i_stack].bottom = action.card;

            return mutatedState;
        }
        else if(action.type === 'STATE DELTA' && action.change === 'CLEAR TABLE') {
            return []
        }

        return state;
    };

    var fOpponents = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA') {
            if(action.change === 'REMOVE FROM OPPONENT HAND') {
                var decreasedState = state.slice(0);

                decreasedState[action.i_opponent].numCards -= 1;

                return decreasedState;
            }
            else if(action.change === 'ADD TO OPPONENT HAND') {
                var increasedState = state.slice(0);

                increasedState[action.i_opponent].numCards += action.numCards;

                return increasedState;
            }
            else if(action.change === 'PLAYER OUT OF GAME') {
                var outedState = state.slice(0); // TODO: these variable names...

                outedState[action.i_opponent].inGame = false;

                return outedState;
            }
        }

        return state;
    };

    var fLeftoverStackSize = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA' && action.change === 'REMOVE FROM DECK') {
            return state - action.numCards;
        }

        return state;
    };

    var fBottomCard = function(state, action) { if(state === undefined) { return null; } return state; };

    var fPlayedStackSize = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'STATE DELTA' && action.change === 'ADD TO PLAYED DECK') {
            return state + action.numCards;
        }

        return state;
    };

    var fDefendMoveCard = function(state, action) {
        if(state === undefined) {
            return null;
        }

        if(action.type === 'DEFEND CLICK') {
            return action.card;
        }
        else if(action.type === 'CANCEL DEFEND') {
            return null;
        }
        else if(action.type === 'STATE DELTA' && action.change === 'PHASE') {
            return null;
        }

        return state;
    };

    var fTimer = function(state, action) {
        console.log("fTimer", state, action);

        if(state === undefined) {
            return null;
        }

        if(action.type === 'TIMER TICK' && state !== null) {
            if(state.numSeconds === 0) {
                clearInterval(state.interval);

                return null;
            }
            else {
                return Object.assign({}, state, {
                    numSeconds: state.numSeconds - 1
                });
            }
        }
        else if(action.type === 'SET TIMER') {
            if(state !== null) {
                clearInterval(state.interval);
            }

            return {
                numSeconds: action.numSeconds,
                interval: setInterval(function() {
                    console.log("will tick");

                    uiStore.dispatch({
                        type: 'TIMER TICK'
                    });
                }, 1000)
            }
        }

        return state;
    };

    var fOptedEndMove = function(state, action) {
        if(state === undefined) {
            return false;
        }

        if(action.type === 'STATE DELTA') {
            if(action.change === 'PUT ON TABLE' || action.change === 'PUT ONTO STACK' || action.change === 'PHASE') {
                return false;
            }
        }
        else if(action.type === 'OPT TO END MOVE') {
            return true;
        }

        return state;
    };

    var fInitializedGame = Redux.combineReducers({
        numPlayers: fNumPlayers,
        currentPhase: fCurrentPhase,
        currentActor: fCurrentActor,
        playerHand: fPlayerHand,
        tableStacks: fTableStacks,
        opponents: fOpponents,
        leftoverStackSize: fLeftoverStackSize,
        bottomCard: fBottomCard,
        playedStackSize: fPlayedStackSize,
        defendMoveCard: fDefendMoveCard, // TODO: move these out of the game state (or rename the "game state"?)
        timer: fTimer,
        optedEndMove: fOptedEndMove
    });

    var fGame = function(state, action) {
        if(state === undefined) {
            return 'no game'; // TODO: move this into the game state (?) to have a proper reducer
        }

        if(action.type === 'INITIALIZE GAME') {
            return fGame(action.init_state, {type: NaN});
        }
        else if(state !== 'no game') {
            return fInitializedGame(state, action);
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
            else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
                return true;
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
            else if(action.type === 'INITIALIZE GAME') {
                return 'in game';
            }
            else if(action.type === 'STATE DELTA' && action.change === 'GAME ENDED') {
                return 'game end';
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

        var fCurrentNickname = function(state, action) {
            if(state === undefined) {
                return "Игрок"; // TODO: magic value
            }

            if(action.type === 'CONFIRM SET NICKNAME') {
                return action.newNickname;
            }

            return state;
        };

        var fNicknamePrompt = function(state, action) {
            if(state === undefined) {
                return "";
            }

            if(action.type === 'CLICK SET NICKNAME' && state === "") {
                return uiStore.getState().menu.currentNickname;
            }
            else if(action.type === 'CONFIRM SET NICKNAME') {
                return "";
            }

            return state;
        };

        var fChangingNickname = function(state, action) {
            if(state === undefined) {
                return false;
            }

            if(action.type === 'CLICK SET NICKNAME') {
                return true;
            }
            else if(action.type === 'CONFIRM SET NICKNAME') {
                return false;
            }

            return state;
        };

        return Redux.combineReducers({
            displayed: fDisplayed,
            status: fStatus,
            numLooking: fNumLooking,
            currentNickname: fCurrentNickname,
            nicknamePrompt: fNicknamePrompt,
            changingNickname: fChangingNickname
        })
    }();

    var fUiState = Redux.combineReducers({
        game: fGame,
        menu: fMenu
    });

    return Redux.createStore(fUiState);
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

uiStore.subscribe(handleMenuUpdate);
uiStore.subscribe(handleGameUpdate);

var initializeProgram = function() {var canvas = document.getElementById('main_canvas');
    var ctx = canvas.getContext('2d');

    var socket = new WebSocket('ws://localhost:8888/game');

    handleGameUpdate.ctx = ctx; // TODO: put somewhere else

    ctx.clickHandlers = []; // TODO: move somewhere else
    ctx.clickHandlers.push(function(message) {
        if(uiStore.getState().menu.status === 'game end') {
            return;
        }

        var gameState = uiStore.getState().game;

        if(message.target === 'card in hand') {
            if(gameState.currentPhase === 'follow' && gameState.currentActor === 0) {
                console.log("dispatching defend click even though ", message);

                uiStore.dispatch({
                    type: 'DEFEND CLICK',
                    card: message.data
                });
            }
            else {
                // TODO: locally validate move more

                socket.send(JSON.stringify({
                    action: 'MOVE PUT',
                    card: message.data
                }));
            }
        }
        else if(message.target === 'button end move') {
            socket.send(JSON.stringify({
                action: 'MOVE END'
            }));

            uiStore.dispatch({
                type: 'OPT TO END MOVE'
            })
        }
        else if(message.target === 'cancel defend move') {
            uiStore.dispatch({
                type: 'CANCEL DEFEND'
            })
        }
        else if(message.target === 'table stack') {
            if(gameState.defendMoveCard) {
                socket.send(JSON.stringify({
                    action: 'MOVE DEFEND',
                    card: gameState.defendMoveCard,
                    i_stack: message.data
                }))
            }
        }
        else if(message.target === 'button take') {
            socket.send(JSON.stringify({
                action: 'MOVE TAKE'
            }));
        }

        console.log(message); // TODO: remove at some point
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

    document.getElementById('change_nickname').onclick = function() {
        uiStore.dispatch({
            type: 'CLICK SET NICKNAME'
        })
    };

    document.getElementById('nickname_submit').onclick = function() {
        socket.send(JSON.stringify({
            action: 'SET NICKNAME',
            newNickname: document.getElementById('nickname_input').value
        }))
    };

    socket.onmessage = function(event) {
        var action = JSON.parse(event.data);

        console.log("From socket:", action);

        uiStore.dispatch(action);
    };

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
