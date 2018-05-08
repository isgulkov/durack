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

            // TODO: check if "End move" really does disappear appropriately with this shit

            const numEmptyStacks = gameState.tableStacks.reduce((stack, x) => x + (stack.bottom === null));

            let numDefendantCards;

            if(gameState.currentPhase === 'follow') {
                numDefendantCards = gameState.opponents[gameState.iSpotlight - 1].numCards;
            }
            else {
                let iDefendant = gameState.iSpotlight;

                do {
                    iDefendant = (iDefendant + 1) % gameState.numPlayers;
                } while(!gameState.opponents[iDefendant - 1].inGame);

                numDefendantCards = gameState.opponents[iDefendant - 1].numCards
            }

            if(haveCardsToPut && numEmptyStacks < numDefendantCards) {
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
