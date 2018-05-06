import React from 'react';

import {CARD_HEIGHT, CARD_WIDTH} from "./utility/cardSprite";
import { Card } from "./card";

class LeftoverStack extends React.Component {
    render() {
        const stackSize = this.props.stackSize;

        let stack = [];

        for(let i = stackSize - 1; i > 0; i--) {
            stack.push(
                <Card card='back' x={2 * i} y={0} />
            );
        }

        const totalWidth = CARD_WIDTH + 2 * (stackSize - 1);

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
                {stack}
            </div>
        )
    }
}

export { LeftoverStack };
