import React from 'react';

import { connect } from "react-redux";

import { Menu } from "../menu";
import { Game } from "../game";

class _GameUi extends React.Component {
    render() {
        // console.log("Will re-render Ui with new state", this.props.state);

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

export const GameUI = connect(
    state => {
        return {
            state: state
        };
    }
)(_GameUi);
