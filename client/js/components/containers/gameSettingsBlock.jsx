import React from "react";

import { connect } from 'react-redux';

import { HoverTooltip } from "../hoverTooltip";

const noAutoEndHelpText = "По умолчанию начало хода автоматически завершается, если у вас закончились карты" +
    " выбранного достоинства, что выдает противнику информацию о вашей руке.";

class _GameSettingsBlock extends React.Component {
    handleToggle(e, newVal) {
        e.preventDefault();
        this.props.sendNoAutoEnd(newVal);
    }

    render() {
        const noAutoEnd = this.props.noAutoEnd;

        return (
            <div className={'paragraph'}>
                <div>
                    <em>Настройки интерфейса:</em>
                </div>
                <div>
                    Не завершать при отсутствии карт&nbsp;
                    <HoverTooltip helpText={noAutoEndHelpText}><strong>?</strong></HoverTooltip>:&nbsp;
                    <a className={'js' + (noAutoEnd ? ' sel-var' : '')}
                       href="#"
                       onClick={e => this.handleToggle(e, true)}>да</a> |&nbsp;
                    <a className={'js' + (noAutoEnd ? '' : ' sel-var')}
                       href="#"
                       onClick={e => this.handleToggle(e, false)}>нет</a>
                </div>
            </div>
        );
    }
}

export const GameSettingsBlock = connect(
    undefined,
    {
        sendNoAutoEnd: (newVal) => {
            return {
                type: 'send-set-no-auto-end',
                newVal: newVal
            }
        }
    }
)(_GameSettingsBlock);
