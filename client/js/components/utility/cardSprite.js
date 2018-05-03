
import cardSpriteUrl from '../../../img/cards.gif';

const CARD_WIDTH = 72;
const CARD_HEIGHT = 100;

const getCardSpriteOffset = card => {
    console.log("got card", card);

    if(card === 'back') {
        return {
            x: 5 * CARD_WIDTH,
            y: 4 * CARD_HEIGHT
        }
    }
    else {
        const y = CARD_HEIGHT * ['hearts', 'diamonds', 'clubs', 'spades'].indexOf(card.suit);
        const x = CARD_WIDTH * ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].indexOf(card.rank);

        console.log(card, x / CARD_WIDTH, y / CARD_HEIGHT, x, y);

        return {
            x: x,
            y: y
        }
    }
};

export { CARD_WIDTH, CARD_HEIGHT, cardSpriteUrl, getCardSpriteOffset };
