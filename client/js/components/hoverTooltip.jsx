import React from 'react';

class HoverTooltip extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            position: null
        };
    }

    render() {
        console.log(this.state.position);

        return (
            <React.Fragment>
                <div className={'tooltip'}
                     style={
                         this.state.position !== null ? {
                             'display': 'block',
                             'left': (this.state.position[0] + 5) + 'px',
                             'top': (this.state.position[1] + 10) + 'px'
                         } : {}
                     }>
                    { this.props.helpText }
                </div>
                <span className={'noselect'}
                      onMouseMove={e => this.setState({position: [e.clientX, e.clientY]})}
                      onMouseLeave={() => this.setState({position: null})}>
                    { this.props.children }
                </span>
            </React.Fragment>
        );
    }
}

export { HoverTooltip };
