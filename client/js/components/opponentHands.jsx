import React from 'react';

import { CARD_WIDTH, CARD_HEIGHT } from "./utility/cardSprite";
import { getOpponentHandCenters } from "./utility/gameField";
import {Card} from "./card";

class NicknameBox extends React.Component {
    render() {
        return (
            <div style={{
                'position': 'absolute',
                'left': this.props.handCenter.x,
                'top': this.props.handCenter.y + CARD_HEIGHT / 2 + 5,

                'opacity': this.props.isInGame ? 1.0 : 0.5
            }}>
                <div style={{
                    'position': 'relative',
                    'left': '-50%',

                    'background': 'rgba(255, 255, 255, 0.8)',

                    'font': '16px Helvetica, sans-serif',
                    'textAlign': 'center',
                    'maxWidth': '150px',

                    'padding': '0 5px'
                }}
                >
                    {this.props.nickname}
                </div>
            </div>
        );
    }
}

class OpponentHand extends React.Component {
    render() {
        const opponentHand = this.props.opponentHand;
        const handCenter = this.props.handCenter;

        const handSize = opponentHand.numCards;

        let hand = [];

        if(handSize !== 0) {
            const cardSpacing = Math.min(10, 100 / handSize);

            const handWidth = cardSpacing * (handSize - 1) + CARD_WIDTH;

            for(let i = handSize - 1; i >= 0; i--) {
                hand.push(
                    <Card x={handCenter.x - handWidth / 2 + cardSpacing * i}
                          y={handCenter.y - CARD_HEIGHT / 2}
                          card={'back'}
                          key={i}/>
                );
            }
        }
        else {
            // TODO: do more beautifully

            hand.push(
                <div style={{
                    'position': 'absolute',
                    'left': handCenter.x - 25,
                    'top': handCenter.y - 25,

                    'width': 50,
                    'height': 50,

                    'background': 'rgba(127, 127, 127, 0.3)'
                }}/>
            )
        }

        // Draw nickname

        return (
            <div>
                {hand}
                <NicknameBox handCenter={handCenter}
                             nickname={opponentHand.nickname}
                             isInGame={opponentHand.inGame}/>
            </div>
        )
    }
}

class OpponentHands extends React.Component {
    render() {
        const opponentHands = this.props.opponentHands;

        const handCenters = getOpponentHandCenters(opponentHands.length + 1);

        let hands = [];

        for(let i = 0; i < opponentHands.length; i++) {
            hands.push(
                <OpponentHand handCenter={handCenters[i]}
                              opponentHand={opponentHands[i]}
                              key={i}/>
            );
        }

        return (
            <div>
                {
                    hands
                }
            </div>
        );
    }
}

export { OpponentHands };
