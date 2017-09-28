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
            var x = CARD_WIDTH * ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(card.value);

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

        this.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

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
                this.arc(this.canvasWidth / 2, this.canvasHeight + 300, 500, 0, Math.PI, true);
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

        var totalLeftOffset = (this.canvasWidth - handWidth) / 2;

        for(var i = 0; i < playerCards.length; i++) {
            this.drawCard(playerCards[i], totalLeftOffset + cardSpacing * i, this.canvasHeight - CARD_HEIGHT - 50);
        }
    };
    CanvasRenderingContext2D.prototype.drawCardsOnTable = function(tableStacks) {
        var stackSpacing = Math.min(CARD_WIDTH + 20, (550 - CARD_WIDTH) / tableStacks.length);

        var totalLeftOffset = (this.canvasWidth - stackSpacing * (tableStacks.length)) / 2;
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
            this.drawCard('back', this.canvasWidth - CARD_WIDTH - 5 - cardSpacing * i, this.canvasHeight - CARD_HEIGHT + 10);
        }
    };

    CanvasRenderingContext2D.prototype.displayGameState = function(gameState) {
        this.drawBackground(gameState.numPlayers, gameState.currentPhase, gameState.currentActor);

        this.drawPlayersHand(gameState.playerHand);

        this.drawCardsOnTable(gameState.tableStacks);

        this.drawOpponentHands(gameState.opponents);

        this.drawLeftoverStack(gameState.leftoverStackSize, gameState.bottomCard);

        this.drawPlayedStack(gameState.playedStackSize);
    };
}());

var initialState = {
    numPlayers: 6,

    currentPhase: 'init',
    currentActor: 1,

    playerHand: [
        {suit: 'spades', value: '10'},
        {suit: 'hearts', value: 'A'},
        {suit: 'clubs', value: 'Q'},
        {suit: 'clubs', value: '7'},
        {suit: 'hearts', value: '8'},
        {suit: 'diamonds', value: '8'},
        {suit: 'spades', value: '10'},
        {suit: 'hearts', value: 'A'},
        {suit: 'clubs', value: 'Q'},
        {suit: 'clubs', value: '7'},
        {suit: 'hearts', value: '8'},
        {suit: 'diamonds', value: '8'},
        {suit: 'spades', value: '10'},
        {suit: 'hearts', value: 'A'},
        {suit: 'clubs', value: 'Q'},
        {suit: 'clubs', value: '7'},
        {suit: 'hearts', value: '8'},
        {suit: 'diamonds', value: '8'}
    ],

    tableStacks: [
        {
            top: {suit: 'spades', value: '10'},
            bottom: {suit: 'hearts', value: 'A'}
        },
        {
            top: {suit: 'clubs', value: 'Q'},
            bottom: {suit: 'clubs', value: '7'}
        },
        {
            top: {suit: 'spades', value: '10'},
            bottom: {suit: 'hearts', value: 'A'}
        },
        {
            top: {suit: 'clubs', value: 'Q'},
            bottom: {suit: 'clubs', value: '7'}
        },
        {
            top: {suit: 'spades', value: '10'},
            bottom: {suit: 'hearts', value: 'A'}
        },
        {
            top: {suit: 'clubs', value: 'Q'},
            bottom: {suit: 'clubs', value: '7'}
        },
        {
            top: {suit: 'spades', value: '10'},
            bottom: {suit: 'hearts', value: 'A'}
        },
        {
            top: {suit: 'clubs', value: 'Q'},
            bottom: {suit: 'clubs', value: '7'}
        },
        {
            top: {suit: 'spades', value: '10'},
            bottom: {suit: 'hearts', value: 'A'}
        },
        {
            top: {suit: 'clubs', value: 'Q'},
            bottom: {suit: 'clubs', value: '7'}
        },
        {
            top: {suit: 'hearts', value: '8'}
        },
        {
            top: {suit: 'diamonds', value: '8'}
        }
    ],

    opponents: [
        {nickname: 'pidor', numCards: 2},
        {nickname: 'Григорий Козинов отсосал хуев корзину', numCards: 25},
        {nickname: '|||/||//||///111', numCards: 15},
        {nickname: '1ll1l1ll1l1lll11', numCards: 10},
        {nickname: 'o priv', numCards: 18}
    ],

    leftoverStackSize: 2,
    bottomCard: {suit: 'hearts', value: 'A'},

    playedStackSize: 10
};

var gameState = function(state, action) {
    if(action.type === 'COME ON IT') {
        var phase = state.currentPhase, actor = state.currentActor;

        console.log(phase, actor);

        if(phase === 'init') {
            phase = 'follow';

            actor += 1;
            actor %= state.numPlayers;
        }
        else {
            phase = 'init'
        }

        console.log(phase, actor);

        return Object.assign({}, state, {
            currentPhase: phase,
            currentActor: actor
        });
    }

    return state;
};

var gameStore = Redux.createStore(gameState, initialState);

gameStore.subscribe(function() {
    window.requestAnimationFrame(function(t) {
        gameStore.ctx.displayGameState(gameStore.getState());
    });
});

document.addEventListener('DOMContentLoaded', function() {
    cardSpritesImg.addEventListener('load', function() {
        var canvas = document.getElementById('main_canvas');
        var ctx = canvas.getContext('2d');

        ctx.canvasWidth = canvas.width;
        ctx.canvasHeight = canvas.height;

        gameStore.ctx = ctx; // TODO: put somewhere else

        window.requestAnimationFrame(function() {
            window.requestAnimationFrame(function(t) {
                gameStore.ctx.displayGameState(gameStore.getState());
            });
        });

        var socket = new WebSocket('ws://localhost:8888/game');

        socket.onmessage = function(event) {
            var action = JSON.parse(event.data);

            gameStore.dispatch(action);
        };

        // TODO: restructure with ES6 imports using Babel
    });
});
