import React from "react";

import { BgCanvas } from "./bgCanvas";
import { Card } from "./card";
import { PlayersHand } from "./containers/playersHand";
import { CardsOnTable } from "./containers/cardsOnTable";

// TODO: propagate these to BgCanvas
const TABLE_WIDTH = 1000;
const TABLE_HEIGHT = 600;

class Game extends React.Component {
    render() {
        let gameState = this.props.state;

        return (
            <div id="canvas_container">
                <div id="main_canvas" style={{'width': TABLE_WIDTH, 'height': TABLE_HEIGHT, 'padding': 0, 'position': 'relative'}}>
                    <BgCanvas numPlayers={gameState.numPlayers}
                              currentPhase={gameState.currentPhase}
                              currentActor={gameState.currentActor}>
                    </BgCanvas>

                    <Card x={100} y={100} card={{rank: '10', suit: 'diamonds'}}/>
                    <Card x={200} y={300} card={{rank: 'Q', suit: 'hearts'}}/>
                    <Card x={700} y={100} card={{rank: 'A', suit: 'spades'}}/>
                    <Card x={150} y={150} card={'back'}/>

                    <PlayersHand playersCards={gameState.playerHand}
                                 totalWidth={TABLE_WIDTH} // TODO: remove the need in those somehow?
                                 totalHeight={TABLE_HEIGHT}
                                 // TODO: rename to `selectedDefendCard` or something
                                 defendMoveCard={gameState.defendMoveCard} />

                    <CardsOnTable tableStacks={gameState.tableStacks}
                                  isDefendMove={gameState.defendMoveCard !== null}
                                  totalWidth={TABLE_WIDTH} />
                </div>
            </div>
        );
    }
}

export { Game };
