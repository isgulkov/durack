import React from 'react';
import { connect } from 'react-redux';

class _EndGameBlock extends React.Component {
    getInnerDivStyle() {
        return {
            // 'width': '90%',
            'textAlign': 'left'
        }
    }

    render() {
        const endSummary = this.props.endSummary;

        let winnerList = null;

        if(endSummary.orderWon.length !== 0) {
            if(endSummary.iYou !== null) {
                endSummary.orderWon[endSummary.iYou] += " (вы)";
            }

            winnerList = (
                <div>
                    <p><em>Вышли:</em></p>

                    <ol style={{'textAlign': 'left', 'marginTop': '-8px'}}>
                        {
                            endSummary.orderWon.map((nickname, i) => {
                                return (
                                    <li key={i}>{nickname}</li>
                                );
                            })
                        }
                    </ol>
                </div>
            );
        }

        let leaverList = null;

        if(endSummary.orderDisconnected.length !== 0) {
            leaverList = (
                <p style={{'textAlign': 'left'}}>
                    Ливнули:&nbsp;
                    {
                        endSummary.orderDisconnected.join(", ")
                    }
                </p>
            );
        }

        return (
            <div>
                <strong>
                    Игра окончена.
                </strong>
                {
                    endSummary.loserNickname === null ? (
                        <div>Произошла ничья</div>
                    ) : endSummary.loserIsYou ? (
                        <div>Дураком оказались вы</div>
                    ) : (
                        <div>Дураком оказался <em>{ endSummary.loserNickname }</em></div>
                    )
                }

                { winnerList }

                { leaverList }

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
