/**
 * Created by frnkymac on 14/9/17.
 */

'use strict';

var CARD_WIDTH = 72;
var CARD_HEIGHT = 100;

var cardSpritesImg = new Image(); // TODO: replace data uri with url/onload
cardSpritesImg.src = 'img/cards.gif';

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

var drawCard = function(card, x, y) {
    var offset = getCardSpriteOffset(card);

    this.drawImage(cardSpritesImg, offset.x, offset.y, CARD_WIDTH, CARD_HEIGHT, x, y, CARD_WIDTH, CARD_HEIGHT);
};

var drawPlayersHand = function(playerCards) {
    var totalOffset = (this.canvasWidth - CARD_WIDTH * playerCards.length - 10 * (playerCards.length - 1)) / 2;

    for(var i = 0; i < playerCards.length; i++) {
        this.drawCard(playerCards[i], totalOffset + (CARD_WIDTH + 10) * i, this.canvasHeight - CARD_HEIGHT - 50);
    }
};

var drawCardsOnTable = function(tableStacks) {
    var totalLeftOffset = (this.canvasWidth - CARD_WIDTH * tableStacks.length - 20 * (tableStacks.length - 1)) / 2;
    var topOffset = 200;

    for(var i = tableStacks.length - 1; i >= 0; i--) {
        this.drawCard(tableStacks[i].top, totalLeftOffset + (CARD_WIDTH + 20) * i, topOffset);

        if(tableStacks[i].bottom !== undefined) {
            this.drawCard(
                tableStacks[i].bottom,
                totalLeftOffset + 5 + (CARD_WIDTH + 20) * i,
                topOffset + CARD_HEIGHT / 2
            );
        }
    }
};

var drawOpponentHands = function(opponentHands) {
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

CanvasRenderingContext2D.prototype.drawCard = drawCard;
CanvasRenderingContext2D.prototype.drawPlayersHand = drawPlayersHand;
CanvasRenderingContext2D.prototype.drawCardsOnTable = drawCardsOnTable;
CanvasRenderingContext2D.prototype.drawOpponentHands = drawOpponentHands;

$(document).ready(function() {
    cardSpritesImg.addEventListener('load', function() {
        var canvas = document.getElementById('main_canvas');
        var ctx = canvas.getContext('2d');

        ctx.canvasWidth = canvas.width;
        ctx.canvasHeight = canvas.height;

        /*
         * Fill background
         */

        var grad = ctx.createLinearGradient(0, 0, 0, 600);

        grad.addColorStop(0.0, '#afa');
        grad.addColorStop(0.75, '#0c0');
        grad.addColorStop(1.0, '#070');

        ctx.fillStyle = grad;

        // Windows Solitaire bg color
        // ctx.fillStyle = '#008000';

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var playerCards = [{suit: 'spades', value: '10'}, {suit: 'hearts', value: 'A'}, {suit: 'clubs', value: 'Q'}, {suit: 'clubs', value: '7'}, {suit: 'hearts', value: '8'}, {suit: 'diamonds', value: '8'}];

        ctx.drawPlayersHand(playerCards);

        var tableStacks = [
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
            ];

        ctx.drawCardsOnTable(tableStacks);

        ctx.drawOpponentHands([
            {nickname: 'pidor', numCards: 2},
            {nickname: 'pidor pidor pidor pidor', numCards: 25},
            {nickname: '|||/||//||///111', numCards: 15},
            {nickname: '1ll1l1ll1l1lll11', numCards: 10},
            {nickname: 'o priv', numCards: 18}
        ]);
    });
});
