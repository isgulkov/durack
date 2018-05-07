import React from 'react';

import {CARD_HEIGHT, CARD_WIDTH} from "./utility/cardSprite";
import { Card } from "./card";

class LeftoverDeck extends React.Component {
    render() {
        const deckSize = this.props.deckSize;

        let deck = [];

        for(let i = deckSize - 1; i > 0; i--) {
            deck.push(
                <Card card='back' x={2 * i} y={0} key={i} />
            );
        }

        const totalWidth = CARD_WIDTH + 2 * (deckSize - 1);

        const offsetAfterRotate = (totalWidth - CARD_HEIGHT) / 2;

        return (
            <div style={{
                'width': totalWidth,
                'height': CARD_HEIGHT,
                'position': 'absolute',
                'bottom': offsetAfterRotate,
                'left': -offsetAfterRotate + 50 - (CARD_HEIGHT - CARD_WIDTH) / 2,
                'transform': 'rotate(90deg)'
            }}>
                {deck}
            </div>
        )
    }
}

export { LeftoverDeck };
