import React from 'react';
import { connect } from 'react-redux';

class _EndGameBlock extends React.Component {
    render() {
        const endSummary = this.props.endSummary;

        return (
            <div>
                <p>
                    Игра окончена.
                </p>

                {
                    endSummary.isLoser ? (
                        <p>
                            Дураком оказались вы
                        </p>
                    ) : (
                        <p>
                            Дураком оказался <em>{ endSummary.loserNickname }</em>
                        </p>
                    )
                }

                <p>
                    <a href="#" onClick={e => {
                        e.preventDefault();
                        this.props.sendFinishGame();
                    }}>Назад в меню</a>
                </p>
            </div>
        );
    }
}

export let EndGameBlock = connect(
    undefined,
    {
        sendFinishGame: () => {
            return {
                type: 'FINISH GAME'
            };
        }
    }
)(_EndGameBlock);
