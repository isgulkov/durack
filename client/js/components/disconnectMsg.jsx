import React from 'react';

class DisconnectMsg extends React.Component {
    getStyle() {
        return {
            'position': 'fixed',
            'top': 0,
            'left': 0,

            'width': ' 100%',

            'background': 'red',
            'color': 'white'
        }
    }

    render() {
        return (
            <div style={this.getStyle()}>
                Потеряно соеднинение с сервером
            </div>
        )
    }
}

export { DisconnectMsg };
