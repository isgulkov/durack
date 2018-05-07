import React from "react";

import { BgCanvas } from "./bgCanvas";
import { PlayersHand } from "./containers/playersHand";
import { CardsOnTable } from "./containers/cardsOnTable";
import { OpponentHands } from "./opponentHands";
import { BigControl } from "./containers/bigControl";
import { Timer } from "./timer";
import { BottomCard } from "./bottomCard";
import { LeftoverStack } from "./leftoverStack";
import { PlayedStack } from "./playedStack";

// TODO: propagate these to BgCanvas
const TABLE_WIDTH = 1000;
const TABLE_HEIGHT = 600;

class Game extends React.Component {
    render() {
        // console.log("Will re-render Game with new state", this.props.state);

        let gameState = this.props.state;

        if(gameState === 'no game') {
            return null;
        }

        return (
            <div id="canvas_container">
                <div id="main_canvas"
                     style={{
                         'width': TABLE_WIDTH,
                         'height': TABLE_HEIGHT,
                         'padding': 0,
                         'position': 'relative',
                         'overflow': 'hidden'
                     }}
                >
                    <BgCanvas numPlayers={gameState.numPlayers}
                              currentPhase={gameState.currentPhase}
                              currentActor={gameState.currentActor}>
                    </BgCanvas>

                    {/*
                    TODO: remove the need in passing totalHeight and totalWidth to children by making components
                    TODO: placeable against top, right, bottom and left,
                    TODO: and also somehow against center of the container?
                     */}

                    <PlayersHand playersCards={gameState.playerHand}
                                 totalWidth={TABLE_WIDTH}
                                 totalHeight={TABLE_HEIGHT}
                                 // TODO: rename to `selectedDefendCard` or something
                                 defendMoveCard={gameState.defendMoveCard} />

                    <CardsOnTable tableStacks={gameState.tableStacks}
                                  isDefendMove={gameState.defendMoveCard !== null}
                                  totalWidth={TABLE_WIDTH} />

                    <OpponentHands opponentHands={gameState.opponents} />

                    <BigControl gameState={gameState}
                                totalWidth={TABLE_WIDTH}
                                totalHeight={TABLE_HEIGHT}/>

                    <Timer timer={gameState.timer}
                           // TODO: use these to draw timer in different places ?
                           currentPhase={gameState.currentPhase} currentActor={gameState.currentActor}
                           totalWidth={TABLE_WIDTH}
                           totalHeight={TABLE_HEIGHT}/>

                    <BottomCard bottomCard={gameState.bottomCard}
                                stackSize={gameState.leftoverStackSize}
                                totalHeight={TABLE_HEIGHT}/>
                    <LeftoverStack stackSize={gameState.leftoverStackSize}/>

                    <PlayedStack stackSize={gameState.playedStackSize}
                                 totalWidth={TABLE_WIDTH}
                                 totalHeight={TABLE_HEIGHT}/>
                </div>
            </div>
        );
    }
}

export { Game };
