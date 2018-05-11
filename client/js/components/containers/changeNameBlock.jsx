import React from 'react';
import { connect } from 'react-redux';

class _ChangeNameBlock extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            promptVal: props.currentNickname
        };

        this.inputRef = React.createRef();
    }

    handlePromptChange() {
        this.setState({
            promptVal: this.inputRef.current.value
        });
    }

    componentDidUpdate() {
        if(this.props.isChangingNickname) {
            if(this.state.promptVal === null) {
                this.setState({
                    promptVal: this.props.currentNickname
                });

                this.inputRef.current.focus();
            }
        }
        else {
            if(this.state.promptVal !== null) {
                this.setState({
                    promptVal: null
                });
            }
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        this.props.sendNewNickname(this.state.promptVal);
    }

    render() {
        if(this.props.isChangingNickname) {
            return (
                <p>
                    <input ref={this.inputRef}
                           type="text"
                           style={{display: 'inline'}}
                           value={this.state.promptVal}
                           onChange={() => this.handlePromptChange()}
                           onKeyPress={(e) => {
                               if(e.key === 'Enter') {
                                   this.handleSubmit(e)
                               }
                           }}
                    />
                    <a className='js'
                       href="#"
                       onClick={e => this.handleSubmit(e)}>OK</a>
                </p>
            );
        }
        else {
            return (
                <p>
                    Ваше имя: <em>{this.props.currentNickname}</em>&nbsp;
                    <a className='js'
                       href="#"
                       onClick={e => {
                           e.preventDefault();
                           this.props.sendChangeNickname();
                       }}>(изменить)</a>
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
                type: 'send-set-nickname',
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
