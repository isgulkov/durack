import React from 'react';

class PlayerStatsBlock extends React.Component {
    render() {
        const playerStats = this.props.playerStats;

        // const playerStats = {
        //     numPlayed: 101,
        //     numWon: 76,
        //     numLeft: 8
        // };

        if(playerStats === null) {
            return null;
        }

        if(playerStats.numPlayed === 0) {
            return null;
        }

        const tableRows = [
            ["Сыграно:", playerStats.numPlayed],
            ["из них побед:", playerStats.numWon],
            ["Винрейт:", (playerStats.numWon / playerStats.numPlayed * 100).toFixed(2) + '%'],
            ["Покинуто:", playerStats.numLeft],
        ];

        const tdStyle = {
            'width': '100px',
            'textAlign': 'left'
        };

        return (
            <table style={{
                'display': 'block',
                'margin': '0 auto',
                // 'textAlign': 'left',
                width: '200px'
            }}>
                <tbody>
                    {
                        tableRows.map(([left, right], i) => {
                            console.log(left, right);

                            return (
                                <tr key={i}>
                                    <td style={tdStyle}>{left}</td>
                                    <td style={tdStyle}><strong>{right}</strong></td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        );
    }
}

export { PlayerStatsBlock };
