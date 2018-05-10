import React from "react";

import { FindGameBtn, StopLookingBtn } from './containers/findGameButtons';
import { ChangeNameBlock } from './containers/changeNameBlock';
import { EndGameBlock } from "./containers/endGameBlock";

class FindGameBlock extends React.Component {
    render() {
        if(!this.props.isLooking) {
            return (
                <p>
                    <FindGameBtn/>
                </p>
            );
        }
        else {
            return (
                <div id="message_looking_for_game">
                    <p>
                        Идет поиск игры ({this.props.numLooking})...
                    </p>
                    <p>
                        <StopLookingBtn/>
                    </p>
                </div>
            );
        }
    }
}

class Menu extends React.Component {
    getContainerStyle() {
        const status = this.props.state.status;

        const TOP_OFFSET = 200;

        if(status === 'initial' || status === 'looking') {
            const GAME_HEIGHT = 600; // TODO: share with the game field, pass from ui

            return {
                'width': '100%',
                'height': GAME_HEIGHT - TOP_OFFSET,

                'margin': '40px auto',
                'paddingTop': TOP_OFFSET
            };
        }
        else {
            return {
                'position': 'fixed',
                'top': TOP_OFFSET,
                'width': '100%'
            };
        }
    }

    static getMenuStyle() {
        return {
            'margin': '0 auto',
            'maxWidth': '300px',
            'padding': '25px',
            'background': 'white',
            'textAlign': 'center'
        };
    }

    render() {
        const menuState = this.props.state;

        if(!menuState.isDisplayed) {
            return null;
        }

        let findGameBlock = null;

        if(menuState.status === 'initial' || menuState.status === 'looking') {
            findGameBlock = (
                <FindGameBlock isLooking={menuState.status === 'looking'}
                               numLooking={menuState.numLooking} />
            );
        }

        let changeNameBlock = null;

        if(menuState.status === 'initial') {
            changeNameBlock = (
                <ChangeNameBlock isChangingNickname={menuState.changingNickname}
                                 nickname={menuState.currentNickname} />
            );
        }

        let endGameBlock = null;

        if(menuState.status === 'game end') {
            endGameBlock = (
                <EndGameBlock endSummary={menuState.endSummary} />
            );
        }

        return (
            <div style={this.getContainerStyle()}>
                <div style={Menu.getMenuStyle()}>
                    { findGameBlock }
                    { changeNameBlock }
                    { endGameBlock }
                </div>
            </div>
        );
    }
}

export { Menu };
