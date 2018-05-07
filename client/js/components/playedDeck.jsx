import React from 'react';

import { CARD_WIDTH, CARD_HEIGHT } from "./utility/cardSprite";
import { Card } from "./card";

// TODO: make a container, display the deck on click or hover
class PlayedDeck extends React.Component {
    render() {
        const deckSize = this.props.deckSize;

        const cardSpacing = Math.min(10, 80 / deckSize);

        let cards = [];

        for(let i = 0; i < deckSize; i++) {
            cards.push(
                <Card x={this.props.totalWidth - CARD_WIDTH - 5 - cardSpacing * i}
                      y={this.props.totalHeight - CARD_HEIGHT + 10}
                      card={'back'}
                      key={i}/>
            );
        }

        return (
            <div>
                { cards }
            </div>
        );
    }
}

export { PlayedDeck };
