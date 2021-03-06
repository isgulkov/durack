import React from 'react';

import { connect } from "react-redux";

import { Menu } from "../menu";
import { Game } from "../game";
import { DisconnectMsg } from "../disconnectMsg";

import { VERSION_STRING } from "../../config";

class _GameUi extends React.Component {
    render() {
        // console.log("Will re-render Ui with new state", this.props.state);

        let currentState = this.props.state;

        return (
            <div>
                <Game state={currentState.game}
                      playersNickname={currentState.menu.currentNickname} />
                <Menu state={currentState.menu} inGame={currentState.game !== 'no game'} />
                {
                    currentState.socket === null
                        ? <DisconnectMsg isTheFirstTime={!currentState.haveConnected} /> : null
                }
                <div className='footer'>Durack { VERSION_STRING }</div>
            </div>
        );
    }
}

export const GameUI = connect(
    state => {
        return {
            state: state
        };
    }
)(_GameUi);
