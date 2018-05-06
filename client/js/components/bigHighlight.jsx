import React from 'react';

import { Highlight } from "./highlight";

class BigHightlight extends React.Component {
    render() {
        console.log("BHL with props", this.props);

        const newProps = Object.assign({}, this.props);

        newProps.x = (this.props.totalWidth - 200) / 2;
        newProps.y = this.props.totalHeight - 200;

        newProps.width = 200;
        newProps.height = 40;

        console.log("BHL with child props", newProps);

        return (
            <Highlight {...newProps} />
        );
    }
}

export { BigHightlight };
