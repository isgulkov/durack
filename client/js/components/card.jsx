import React from 'react';

import { CARD_WIDTH, CARD_HEIGHT, cardSpriteUrl, getCardSpriteOffset } from "./utility/cardSprite";

class Card extends React.Component {
    getStyle() {
        let style = this.props.style !== undefined ? this.props.style : {};

        const spriteOffset = getCardSpriteOffset(this.props.card);

        Object.assign(style, {
            'width': CARD_WIDTH,
            'height': CARD_HEIGHT,

            'position': 'absolute',
            'left': this.props.x,
            'top': this.props.y,

            'background': 'url(' + cardSpriteUrl + ') ' + (-spriteOffset.x) + 'px ' + (-spriteOffset.y) + 'px',
            'backgroundRepeat': 'no-repeat'
        });

        return style;
    }

    handleClick() {

    }

    render() {
        return (
            <div className={this.props.onClick ? 'clickable' : ''}
                 style={this.getStyle()}
                 onClick={
                     this.props.onClick !== undefined ? (() => this.props.onClick()) : null
                 } />
        );
    }
}

export { Card };
