import React from "react";

import { Menu } from "../components/menu";
import { Game } from "../components/game";

class GameUi extends React.Component {
    render() {
        let currentState = this.props.state;

        if(currentState.game !== "no game") {
            let gameState = currentState.game;

            return (
                <Game state={gameState} />
            );
        }
        else {
            let menuState = currentState.menu;

            return (
                <Menu state={menuState} />
            )
        }
    }
}

export { GameUi };
