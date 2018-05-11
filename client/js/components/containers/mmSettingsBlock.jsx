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
        "Раздача происходит из 52-карточной колоды, после чего остальная часть колоды, кроме двух–шести карт," +
        " по числу игроков, отбрасывается"
    ]
];

const minPlayersVariants = [
    [2, "2"],
    [3, "3"],
    [4, "4"],
    [5, "5"],
    [6, "6"]
];

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
                             'top': (this.state.position[1] + 5) + 'px'
                         } : {}
                     }>
                    { this.props.helpText }
                </div>
                <span onMouseMove={e => this.setState({position: [e.clientX, e.clientY]})}
                      onMouseLeave={() => this.setState({position: null})}>
                    { this.props.children }
                </span>
            </React.Fragment>
        );
    }
}

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
                                    varHelp !== undefined ? <HoverTooltip helpText={varHelp}>
                                        <strong>?</strong>
                                    </HoverTooltip> : null
                                }
                            </span>
                        );
                    })
                }
            </React.Fragment>
        )
    }

    render() {
        const currentSettings = this.props.currentSettings;

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
                type: 'send-set-mm-deck',
                deck: newDeck
            };
        },
        sendChangeMinPlayers: (minPlayers) => {
            return {
                type: 'send-set-mm-min-players',
                minPlayers: minPlayers
            };
        }
    }
)(_MatchmakingSettingsBlock);
