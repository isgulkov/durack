import React from 'react';

class DisconnectMsg extends React.Component {
    getStyle() {
        return {
            'position': 'fixed',
            'top': 0,
            'left': 0,

            'width': ' 100%',

            'background': 'red',
            'color': 'white',

            'textAlign': 'center',
            'fontSize': '16px'
        }
    }

    render() {
        return (
            <div style={this.getStyle()}>
                Потеряно соеднинение с сервером, выполняется попытка восстановления связи...
            </div>
        )
    }
}

export { DisconnectMsg };
