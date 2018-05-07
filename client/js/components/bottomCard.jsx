import React from 'react';

import { CARD_HEIGHT, CARD_WIDTH } from "./utility/cardSprite";
import { Card } from "./card";

class BottomCard extends React.Component {
    render() {
        const deckSize = this.props.deckSize;

        const additionalOffset = 2 * Math.max(15, deckSize);

        if(deckSize !== 0) {
            return (
                <Card card={this.props.bottomCard}
                      x={50}
                      y={this.props.totalHeight - CARD_HEIGHT - additionalOffset} />
            );
        }
        else {
            return (
                <Card card={this.props.bottomCard}
                      x={50}
                      y={this.props.totalHeight - CARD_HEIGHT - additionalOffset}
                      style={{
                          'opacity': 0.6,
                          'mixBlendMode': 'darken',
                          'backgroundBlendMode': 'darken'
                      }} />
            );
        }
    }
}

export { BottomCard };
