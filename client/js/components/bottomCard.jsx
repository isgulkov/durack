import React from 'react';

import { CARD_HEIGHT, CARD_WIDTH } from "./utility/cardSprite";
import { Card } from "./card";

class BottomCard extends React.Component {
    render() {
        const stackSize = this.props.stackSize;

        const additionalOffset = 2 * Math.max(15, stackSize);

        if(stackSize !== 0) {
            return (
                <Card card={this.props.bottomCard}
                      x={50}
                      y={this.props.totalHeight - CARD_HEIGHT - additionalOffset}/>
            );
        }
        else {
            return (
                <Card card={this.props.bottomCard} // TODO: blending
                      x={50}
                      y={this.props.totalHeight - CARD_HEIGHT - additionalOffset}/>
            );
        }
    }
}

export { BottomCard };
