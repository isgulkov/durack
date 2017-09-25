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

var drawCard = function(card, x, y) {
    this.save();

    var offset = getCardSpriteOffset(card);

    this.drawImage(cardSpritesImg, offset.x, offset.y, CARD_WIDTH, CARD_HEIGHT, x, y, CARD_WIDTH, CARD_HEIGHT);

    // this.strokeStyle = '#777';
    // this.lineWidth = 1;
    // this.strokeRect(x - 1, y - 1, CARD_WIDTH + 2, CARD_HEIGHT + 2);

    this.fillStyle = 'black';
    this.fillText(card.suit + ", " + card.value, x + 5, y + 50);

    this.restore();
};

CanvasRenderingContext2D.prototype.drawCard = drawCard;
CanvasRenderingContext2D.prototype.drawPlayersHand = drawPlayersHand;
CanvasRenderingContext2D.prototype.drawCardsOnTable = drawCardsOnTable;

$(document).ready(function() {
    cardSpritesImg.addEventListener('load', function() {
        var canvas = document.getElementById('main_canvas');
        var ctx = canvas.getContext('2d');

        ctx.canvasWidth = canvas.width;
        ctx.canvasHeight = canvas.height;

        var grad = ctx.createLinearGradient(0, 0, 0, 600);

        grad.addColorStop(0.0, '#afa');
        grad.addColorStop(0.75, '#0c0');
        grad.addColorStop(1.0, '#070');

        ctx.fillStyle = grad;

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
    });
});
