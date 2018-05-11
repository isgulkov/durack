import React from "react";

import { connect } from 'react-redux';

const deckVariants = [
    [
        'dont-care',
        "неважно",
        "В игре, где у всех игроков здесь выбрано «неважно», колода будет 36-карточная"
    ],
    ['36-card', "36 карт"],
    ['52-card', "52 карты"],
    [
        '52-fast',
        "быстрая",
        "Раздача происходит из 52-карточной колоды, после чего остальная часть колоды, кроме 2–6 карт, отбрасывается"
    ]
];

const minPlayersVariants = [
    [2, "2"],
    [3, "3"],
    [4, "4"],
    [5, "5"],
    [6, "6"]
];

class _MatchmakingSettingsBlock extends React.Component {
    renderVarChange(variants, currentVar, onSelect) {
        return (
            <React.Fragment>
                {
                    variants.map(([varId, varStr, varHelp], iVar) => {
                        return (
                            <span key={varId}>
                                {
                                    iVar !== 0 ? <React.Fragment>&nbsp;|&nbsp;</React.Fragment> : null
                                }
                                <a className={'js' + (varId === currentVar ? ' sel-var' : '')}
                                   href="#"
                                   onClick={e => {
                                       e.preventDefault();
                                       onSelect(varId);
                                   }}>{varStr}</a>
                                {
                                    // TODO: hover help element
                                    varHelp !== undefined ? <React.Fragment><strong>?</strong></React.Fragment> : null
                                }
                            </span>
                        );
                    })
                }
            </React.Fragment>
        )
    }

    render() {
        // const currentSettings = this.props.currentSettings;

        const currentSettings = {
            'deck': '52-card',
            'minPlayers': 2
        };

        return (
            <div>
                <div><em>Настройки поиска игры:</em></div>
                <div>
                    Колода:&nbsp;
                    {
                        this.renderVarChange(deckVariants, currentSettings.deck, (deck) => {
                            this.props.sendChangeDeck(deck);
                        })
                    }
                </div>
                <div>
                    Минимум игроков:&nbsp;
                    {
                        this.renderVarChange(minPlayersVariants, currentSettings.minPlayers, (minPlayers) => {
                            this.props.sendChangeMinPlayers(minPlayers)
                        })
                    }
                </div>
            </div>
        );
    }
}

export const MatchmakingSettingsBlock = connect(
    undefined,
    {
        sendChangeDeck: (newDeck) => {
            return {
                type: 'send-change-mm-deck',
                newDeck: newDeck
            };
        },
        sendChangeMinPlayers: (minPlayers) => {
            return {
                type: 'send-change-mm-min-players',
                minPlayers: minPlayers
            };
        }
    }
)(_MatchmakingSettingsBlock);
