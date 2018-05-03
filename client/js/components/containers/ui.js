import { connect } from "react-redux";

import { GameUi } from "../ui";

const mapStateToProps = state => {
    return {
        state: state
    };
};

const ReprGameUI = connect(mapStateToProps)(GameUi);

export { ReprGameUI };
