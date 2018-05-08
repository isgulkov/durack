import React from 'react';

import { getTimeString } from "./utility/timer";

class Timer extends React.Component {
    getStyle() {
        return {
            'width': '200px',
            'height': '32px',

            'padding': '0px',

            'position': 'absolute',
            'left': this.props.totalWidth / 2 - 100,
            'top': this.props.totalHeight - 225,

            'font': '32px serif',
            'color': 'black',
            'textAlign': 'center',
            'verticalAlign': 'middle',
            'lineHeight': '32px',

            'userSelect': 'none'
        }
    }

    render() {
        const timer = this.props.timer;

        if(timer === null) {
            return null;
        }

        return (
            <div style={this.getStyle()}>
                {getTimeString(timer.numSeconds)}
            </div>
        )
    }
}

export { Timer };
