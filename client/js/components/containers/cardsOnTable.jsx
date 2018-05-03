import React from 'react';

import { connect } from 'react-redux';

import { CARD_WIDTH, CARD_HEIGHT } from "../utility/cardSprite";
import { Card } from "../card";
import { Highlight } from "../highlight";

class _CardsOnTable extends React.Component {
    render() {
        const tableStacks = this.props.tableStacks;

        const stackSpacing = Math.min(CARD_WIDTH + 20, (550 - CARD_WIDTH) / tableStacks.length);

        const totalLeftOffset = (this.props.totalWidth - stackSpacing * (tableStacks.length)) / 2;
        const topOffset = 225;

        let tops = [];
        let bottoms = [];

        let buttons = [];

        for(let i = 0; i < tableStacks.length; i++) {
            tops.push(
                <Card x={totalLeftOffset + (stackSpacing) * i} y={topOffset} card={tableStacks[i].top} />
            );

            const bottomCardX = totalLeftOffset + 5 + (stackSpacing) * i;
            const bottomCardY = topOffset + CARD_HEIGHT / 2;

            if(tableStacks[i].bottom !== null) {
                bottoms.push(
                    <Card x={bottomCardX} y={bottomCardY} card={tableStacks[i].bottom} />
                );
            }
            else if(this.props.isDefendMove) {
                buttons.push(
                    <Highlight x={bottomCardX} y={bottomCardY} width={CARD_WIDTH} height={CARD_HEIGHT}
                               bgColor={'black'} onClick={() => this.props.sendTableStackClick(i)} />
                );
            }
        }

        return (
            <div>
                { tops }
                { bottoms }
                { buttons }
            </div>
        );
    }
}

export const CardsOnTable = connect(
    undefined,
    {
        sendTableStackClick: iStack => {
            return {
                type: 'SEND TABLE STACK CLICK',
                iStack: iStack
            };
        }
    }
)(_CardsOnTable);
