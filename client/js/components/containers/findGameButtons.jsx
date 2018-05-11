import React from 'react';
import { connect } from 'react-redux';

class _FindGameBtn extends React.Component {
    render() {
        return (
            <a className='js'
               href="#"
               onClick={e => {
                   e.preventDefault();
                   this.props.sendFindGame();
               }}>
                <strong>Найти игру</strong>
            </a>
        );
    }
}

class _StopLookingBtn extends React.Component {
    render() {
        return (
            <a className='js'
               href="#"
               onClick={e => {
                   e.preventDefault();
                   this.props.sendStopLooking();
               }}>
                <strong>Отмена</strong>
            </a>
        );
    }
}

export let
    FindGameBtn = connect(
        undefined,
        {
            sendFindGame : (() => {
                return { type: 'SEND FIND GAME' }
            })
        })(_FindGameBtn),
    StopLookingBtn = connect(
        undefined,
        {
        sendStopLooking : (() => {
            return { type: 'SEND STOP LOOKING' }
        })
    })(_StopLookingBtn);
