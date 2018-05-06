import React from 'react';

import { connect } from 'react-redux';

import { BigHightlight } from "../bigHighlight";

class _BigControl extends React.Component {
    render() {
        const gameState = this.props.gameState;

        if(gameState.currentPhase === 'follow' && gameState.currentActor === 0 && gameState.tableStacks.length !== 0) {
            return (
                <BigHightlight totalWidth={this.props.totalWidth} totalHeight={this.props.totalHeight}
                               text="Забрать" onClick={() => this.props.sendTakeClick()}/>
            );
        }
        else if((gameState.currentPhase === 'init' && gameState.currentActor === 0) ||
            (!gameState.optedEndMove && gameState.currentPhase === 'follow' && gameState.currentActor !== 0)) {
            const putPossible = gameState.playerHand.some(playerCard => {
                return gameState.tableStacks.some(stack => {
                    if(playerCard.rank === stack.top.rank) {
                        return true;
                    }

                    if(stack.bottom !== null && playerCard.rank === stack.bottom.rank) {
                        return true;
                    }
                });
            });

            if(putPossible) {
                return (
                    <BigHightlight totalWidth={this.props.totalWidth} totalHeight={this.props.totalHeight}
                                   text="Закончить ход" onClick={() => this.props.sendEndMove()} />
                );
            }
        }

        return null;
    }
}

export const BigControl = connect(
    undefined,
    {
        sendTakeClick: () => {
            return {
                type: 'SEND TAKE'
            };
        },
        sendEndMove: () => {
            return {
                type: 'SEND END MOVE'
            };
        }
    }
)(_BigControl);
