import React from "react";

class Game extends React.Component {
    render() {
        return (
            <div id="canvas_container">
                <canvas ref="canvas" id="main_canvas" width="1000" height="600"></canvas>
            </div>
        );
    }
}

export { Game };
