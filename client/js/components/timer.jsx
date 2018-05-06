import React from 'react';

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
        }
    }

    static getTimeString(nSecs) {
        const minutes = Math.floor(nSecs / 60);
        const seconds = Math.floor(nSecs % 60);

        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }

    render() {
        const timer = this.props.timer;

        if(!timer) {
            return null;
        }

        return (
            <div style={this.getStyle()}>
                {Timer.getTimeString(timer.numSeconds)}
            </div>
        )
    }
}

export { Timer };
