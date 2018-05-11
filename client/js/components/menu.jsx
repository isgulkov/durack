import React from "react";

import { FindGameBtn, StopLookingBtn } from './containers/findGameButtons';
import { MatchmakingSettingsBlock } from "./containers/mmSettingsBlock";
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
        // TODO: use a separate "inGame" prop for this

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
            // 'maxWidth': '300px',
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

        let menuInnerBlock = null;

        if(menuState.status === 'initial') {
            menuInnerBlock = (
                <React.Fragment>
                    <FindGameBlock isLooking={false} />
                    <MatchmakingSettingsBlock inMMSettings={false} />
                    <ChangeNameBlock isChangingNickname={menuState.changingNickname}
                                     nickname={menuState.currentNickname} />
                </React.Fragment>
            );
        }
        else if(menuState.status === 'looking') {
            menuInnerBlock = (
                <FindGameBlock isLooking={true}
                               numLooking={menuState.numLooking} />
            );
        }
        else if(menuState.status === 'game end') {
            menuInnerBlock = (
                <EndGameBlock endSummary={menuState.endSummary} />
            );
        }

        return (
            <div style={this.getContainerStyle()}>
                <div style={Menu.getMenuStyle()}>
                    { menuInnerBlock }
                </div>
            </div>
        );
    }
}

export { Menu };
