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
                    <p> { /* TODO: put into a subobject vvv */ }
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
    static getContainerStyle() {
        return {
            'position': 'fixed',
            'top': '200px',
            'width': '100%',
            'textAlign': 'center'
        };
    }

    static getMenuStyle() {
        return {
            'margin': '0 auto',
            'maxWidth': '300px',
            'padding': '25px',
            'background': 'white'
        };
    }

    render() {
        let menuState = this.props.state;

        if(!menuState.displayed) { // TODO: rename to isDisplayed
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
            <div style={Menu.getContainerStyle()}>
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
