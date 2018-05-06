import React from 'react';

import { connect } from 'react-redux';

import { CARD_WIDTH, CARD_HEIGHT } from "../utility/cardSprite";
import { Card } from "../card";
import { Highlight } from "../highlight";

class _PlayersHand extends React.Component {
    render() {
        const playersCards = this.props.playersCards;

        const cardSpacing = Math.min(600 / playersCards.length, CARD_WIDTH + 10);

        const handWidth = cardSpacing * (playersCards.length - 1) + CARD_WIDTH;

        const totalLeftOffset = (this.props.totalWidth - handWidth) / 2;

        let cards = [];
        let defendCardHighLight = null;

        for(let i = 0; i < playersCards.length; i++) {
            const xOffset = totalLeftOffset + cardSpacing * i;
            const yOffset = this.props.totalHeight - CARD_HEIGHT - 50;

            const card = playersCards[i];

            cards.push(
                <Card x={xOffset} y={yOffset} card={card}
                      onClick={() => this.props.sendHandSelect(card)}
                      key={i} />
            );

            const defendMoveCard = this.props.defendMoveCard;

            console.log(defendMoveCard, card);

            if(defendMoveCard !== null && defendMoveCard.suit === card.suit && defendMoveCard.rank === card.rank) {
                defendCardHighLight = (
                    <Highlight text="Отмена" x={xOffset - 4} y={yOffset - 4}
                               width={CARD_WIDTH + 8} height={CARD_HEIGHT} bgColor="blue"
                               fontSize={16} textColor="white" onClick={() => this.props.cancelDefend()} />
                );
            }
        }

        return (
            <div>
                { cards }
                { defendCardHighLight }
            </div>
        )
    }
}

export const PlayersHand = connect(
    undefined,
    {
        sendHandSelect: card => {
            console.log(card);

            return {
                type: 'SEND HAND SELECT',
                card: card
            };
        },
        cancelDefend: () => {
            return {
                type: 'CANCEL DEFEND'
            }
        }
    }
)(_PlayersHand);
