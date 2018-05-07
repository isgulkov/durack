import React from "react";

import { FindGameBtn, StopLookingBtn } from './containers/findGameButtons';
import { ChangeNameBlock } from './containers/changeNameBlock';

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

        return (
            <div style={Menu.getContainerStyle()}>
                <div style={Menu.getMenuStyle()}>
                    { // TODO: switch/if
                        menuState.status === "initial" || menuState.status === "looking"
                            ? <FindGameBlock isLooking={menuState.status === "looking"}
                                             numLooking={menuState.numLooking} />
                            : null
                    }
                    {
                        // TODO: Switch to ' in "symbols" everywhere
                        // TODO: rework the state tree field names into something more sensible (after everything is done)
                        menuState.status !== 'looking'
                            ? <ChangeNameBlock isChangingNickname={menuState.changingNickname}
                                               nickname={menuState.currentNickname} />
                            : null
                    }
                </div>
            </div>
        );
    }
}

export { Menu };
