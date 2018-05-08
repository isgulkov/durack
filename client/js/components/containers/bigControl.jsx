import React from 'react';

import { connect } from 'react-redux';

import { BigHighlight } from "../bigHighlight";

class _BigControl extends React.Component {
    render() {
        const gameState = this.props.gameState;

        if(gameState.currentPhase === 'follow' && gameState.iSpotlight === 0 && gameState.tableStacks.length !== 0) {
            const notAllCovered = gameState.tableStacks.some(stack => {
                return stack.bottom === null;
            });

            if(notAllCovered) {
                return (
                    <BigHighlight totalWidth={this.props.totalWidth} totalHeight={this.props.totalHeight}
                                  text="Забрать" onClick={() => this.props.sendTakeClick()}/>
                );
            }
        }
        else if((gameState.currentPhase === 'init' && gameState.iSpotlight === 0) ||
            (!gameState.optedEndMove && gameState.currentPhase === 'follow' && gameState.iSpotlight !== 0)) {
            const haveCardsToPut = gameState.playerHand.some(playerCard => {
                return gameState.tableStacks.some(stack => {
                    if(playerCard.rank === stack.top.rank) {
                        return true;
                    }

                    if(stack.bottom !== null && playerCard.rank === stack.bottom.rank) {
                        return true;
                    }
                });
            });

            // TODO: narrow down the set of states where this button shows up

            if(haveCardsToPut) {
                return (
                    <BigHighlight totalWidth={this.props.totalWidth} totalHeight={this.props.totalHeight}
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
