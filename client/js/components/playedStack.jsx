import React from 'react';

import { CARD_WIDTH, CARD_HEIGHT } from "./utility/cardSprite";
import { Card } from "./card";

// TODO: make a container, display the stack on click or hover
class PlayedStack extends React.Component {
    render() {
        const stackSize = this.props.stackSize;

        const cardSpacing = Math.min(10, 80 / stackSize);

        let cards = [];

        for(let i = 0; i < stackSize; i++) {
            cards.push(
                <Card x={this.props.totalWidth - CARD_WIDTH - 5 - cardSpacing * i}
                      y={this.props.totalHeight - CARD_HEIGHT + 10}
                      card={'back'} />
            );
        }

        return (
            <div>
                { cards }
            </div>
        );
    }
}

export { PlayedStack };
