import React from "react";

import { getOpponentHandCenters } from "./utility/gameField";

class BgCanvas extends React.Component {
    drawContents() {
        let canvas = this.canvasRef.current;
        let ctx = canvas.getContext('2d');

        let grad = ctx.createLinearGradient(0, 0, 0, 600);

        grad.addColorStop(0.0, '#afa');
        grad.addColorStop(0.75, '#0c0');
        grad.addColorStop(1.0, '#070');

        ctx.fillStyle = grad;

        // Windows Solitaire bg color
        // this.fillStyle = '#008000';

        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if(this.props.currentActor !== null) {
            ctx.save();

            ctx.globalAlpha = 0.5;

            if(this.props.currentPhase === 'init') {
                ctx.globalCompositeOperation = 'overlay';

                ctx.fillStyle = '#fffacd';
            }
            else if(this.props.currentPhase === 'follow') {
                ctx.globalCompositeOperation = 'color';

                ctx.fillStyle = '#ff0000';
            }

            ctx.beginPath();

            if(this.props.currentActor === 0) {
                ctx.arc(canvas.width / 2, canvas.height + 300, 500, 0, Math.PI, true);
            }
            else {
                let opponentCenters = getOpponentHandCenters(this.props.numPlayers);
                let center = opponentCenters[this.props.currentActor - 1];

                ctx.arc(center.x, center.y, 100, 0, 2 * Math.PI);
            }

            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    componentDidUpdate() {
        this.drawContents();
    }

    componentDidMount() {
        this.drawContents();
    }

    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    render() {
        return (
            <canvas ref={this.canvasRef}
                    width={this.props.totalWidth}
                    height={this.props.totalHeight} />
        );
    }
}

export { BgCanvas };
