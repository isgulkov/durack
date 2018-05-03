import React from 'react';

import { CARD_WIDTH, CARD_HEIGHT, cardSpriteUrl, getCardSpriteOffset } from "./utility/cardSprite";

class Card extends React.Component {
    getStyle() {
        const spriteOffset = getCardSpriteOffset(this.props.card);

        const s = {
            'width': CARD_WIDTH,
            'height': CARD_HEIGHT,

            'position': 'absolute',
            'left': this.props.x,
            'top': this.props.y,

            'background': 'url(' + cardSpriteUrl + ') ' + (-spriteOffset.x) + 'px ' + (-spriteOffset.y) + 'px',
            'background-repeat': 'no-repeat'
        };

        return s;
    }

    render() {
        return (
            <div style={this.getStyle()} />
        );
    }
}

export { Card };
