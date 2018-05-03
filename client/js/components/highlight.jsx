import React from 'react';

class Highlight extends React.Component {
    getStyle() {
        return {
            'width': this.props.width,
            'height': this.props.height,

            'opacity': 0.4,
            'backgroundColor': this.props.bgColor || 'white',

            'position': 'absolute',
            'left': this.props.x,
            'top': this.props.y,

            'font': (this.props.fontSize || 24) + 'px Georgia, serif',
            'color': (this.props.textColor || 'black'),
            'textAlign': 'center',
            'verticalAlign': 'middle',
            'lineHeight': this.props.height,
            'padding': 0
        }
    }

    handleClick() {
        if(this.props.onClick !== undefined) {
            this.props.onClick();
        }
    }

    render() {
        return (
            <div style={this.getStyle()} onClick={() => this.handleClick()}>
                {this.props.text || ""}
            </div>
        )
    }
}

export { Highlight };
