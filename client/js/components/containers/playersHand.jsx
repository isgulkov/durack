import React from 'react';

import { connect } from 'react-redux';

import { CARD_WIDTH, CARD_HEIGHT } from "../utility/cardSprite";
import { Card } from "../card";
import { Highlight } from "../highlight";

class BigNickname extends React.Component {
    render() {
        return (
            <div style={{
                'position': 'absolute',
                'left': this.props.totalWidth / 2,
                'bottom': 15,

                'opacity': this.props.isInGame ? 1.0 : 0.5
            }}>
                <div className='noselect' style={{
                    'position': 'relative',
                    'left': '-50%',

                    'background': 'rgba(255, 255, 255, 0.25)',

                    'font': '22px Helvetica, sans-serif',
                    'textAlign': 'center',

                    'padding': '0 5px'
                }}
                >
                    {this.props.nickname}
                </div>
            </div>
        );
    }
}

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
                <BigNickname nickname={this.props.playersNickname}
                             totalWidth={this.props.totalWidth}
                             isInGame={true} />
            </div>
        )
    }
}

export const PlayersHand = connect(
    undefined,
    {
        sendHandSelect: card => {
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
