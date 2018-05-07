import React from 'react';
import { connect } from 'react-redux';

class _ChangeNameBlock extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            promptVal: props.currentNickname
        };
    }

    handlePromptChange() {
        this.setState({
            promptVal: this.refs.nicknamePrompt.value
        });
    }

    componentDidUpdate() {
        if(this.props.isChangingNickname) {
            if(this.state.promptVal === "") {
                this.setState({
                    promptVal: this.props.currentNickname
                });
            }
        }
        else {
            if(this.state.promptVal !== "") {
                this.setState({
                    promptVal: ""
                });
            }
        }
    }

    render() {
        if(this.props.isChangingNickname) {
            return (
                <p>
                    <input ref="nicknamePrompt"
                           type="text"
                           style={{display: 'inline'}}
                           value={this.state.promptVal}
                           onChange={() => this.handlePromptChange()} />
                    <a href="#" onClick={e => {
                        e.preventDefault();
                        console.log("nickname val", this.state.promptVal);
                        this.props.sendNewNickname(this.state.promptVal);
                    }}>OK</a>
                </p>
            );
        }
        else {
            return (
                <p>
                    Ваше имя: <em>{this.props.currentNickname}</em>&nbsp;
                    <a href="#" onClick={e => {
                        e.preventDefault();
                        this.props.sendChangeNickname();
                    }} >(изменить)</a>
                </p>
            );
        }
    }
}

export let ChangeNameBlock = connect(
    (state) => {
        return {
            currentNickname: state.menu.currentNickname
        };
    },
    {
        sendNewNickname: (newNickname) => {
            return {
                type: 'SEND SET NICKNAME',
                newNickname: newNickname
            }
        },
        sendChangeNickname: () => {
            return {
                type: 'CLICK CHANGE NICKNAME'
            }
        }
    }
)(_ChangeNameBlock);
