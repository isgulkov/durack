import React from 'react';

import { getTimeString } from "./utility/timer";

class PlayersDisconnected extends React.Component {
    getStyle() {
        return {
            'width': '250px',
            'height': '400px',

            'opacity': 0.9,
            'backgroundColor': 'red',

            'position': 'absolute',
            'left': this.props.totalWidth / 2 - 125,
            'top': this.props.totalHeight / 2 - 200,

            'font': '12px Georgia, serif',
            'color': 'white',
            'padding': '10px'
        }
    }

    render() {
        const playersDisc = this.props.playersDisconnected;

        if(Object.keys(playersDisc).length === 0) {
            return null;
        }

        const opponentNicknames = this.props.opponentNicknames;

        return (
            <div style={this.getStyle()}>
                <p>
                    <strong>Игроки потеряли соединение:</strong>
                </p>
                {
                    Object.keys(playersDisc).map(iPlayer => {
                        return (
                            <p key={iPlayer}>
                                {opponentNicknames[iPlayer - 1]} — {getTimeString(playersDisc[iPlayer].secondsLeft)}
                            </p>
                        )
                    })
                }
            </div>
        )
    }
}

export { PlayersDisconnected };
