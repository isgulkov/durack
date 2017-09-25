/**
 * Created by frnkymac on 14/9/17.
 */

'use strict';

var CARD_WIDTH = 69;
var CARD_HEIGHT = 94;

var drawCard = function(card, x, y) {
    console.log("card " + card + x + y);

    this.save();

    this.fillStyle = 'white';
    this.fillRect(x, y, CARD_WIDTH, CARD_HEIGHT);

    this.fillStyle = 'black';
    this.fillText("Card " + card.suit + " " + card.value, x + 5, y + 50);

    this.restore();
};

$(document).ready(function() {
    var canvas = document.getElementById('main_canvas');
    var ctx = canvas.getContext('2d');

    ctx.drawCard = drawCard;

    var grad = ctx.createLinearGradient(0, 0, 0, 600);

    grad.addColorStop(0.0, '#afa');
    grad.addColorStop(0.75, '#0c0');
    grad.addColorStop(1.0, '#070');

    ctx.fillStyle = grad;

    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawCard({suit: 'S', value: '10'}, 10, 10);
});
