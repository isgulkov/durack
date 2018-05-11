import React from 'react';

class DisconnectMsg extends React.Component {
    render() {
        if(this.props.isTheFirstTime) {
            return (
                <div className={'disconnect-msg connect-first'}>
                    Подождите, устанавливается соединение с сервером...
                </div>
            )
        }
        else {
            return (
                <div className={'disconnect-msg'}>
                    Потеряно соеднинение с сервером, выполняется попытка восстановления связи...
                </div>
            )
        }
    }
}

export { DisconnectMsg };
