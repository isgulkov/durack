import React from "react";

import { BgCanvas } from "./bgCanvas";
import { Card } from "./card";

class Game extends React.Component {
    render() {
        let gameState = this.props.state;

        return (
            <div id="canvas_container">
                <div id="main_canvas" style={{'width': 1000, 'height': 600, 'padding': 0, 'position': 'relative'}}>
                    <BgCanvas numPlayers={gameState.numPlayers}
                              currentPhase={gameState.currentPhase}
                              currentActor={gameState.currentActor}>
                    </BgCanvas>

                    <Card x={100} y={100} card={{rank: '10', suit: 'diamonds'}}/>
                    <Card x={200} y={300} card={{rank: 'Q', suit: 'hearts'}}/>
                    <Card x={700} y={100} card={{rank: 'A', suit: 'spades'}}/>
                    <Card x={150} y={150} card={'back'}/>
                </div>
            </div>
        );
    }
}

export { Game };
