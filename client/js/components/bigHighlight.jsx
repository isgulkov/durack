import React from 'react';

import { Highlight } from "./highlight";

class BigHighlight extends React.Component {
    render() {
        const newProps = Object.assign({}, this.props);

        newProps.x = (this.props.totalWidth - 200) / 2;
        newProps.y = this.props.totalHeight - 200;

        newProps.width = 200;
        newProps.height = 40;

        return (
            <Highlight {...newProps} />
        );
    }
}

export { BigHighlight };
