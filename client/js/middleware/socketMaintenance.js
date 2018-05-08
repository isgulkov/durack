
const createAndDispatchSocket = (uiStore) => {
    const socket = new WebSocket('ws://localhost:8888/game');

    socket.onopen = () => {
        uiStore.dispatch({
            type: 'SOCKET READY',
            socket: socket
        });

        if(!uiStore.getState().isInitialized) {
            socket.send(JSON.stringify({
                kind: 'request-init'
            }));
        }
    };

    socket.onclose = (e) => {
        console.log("Socket closed for some fucking reason", e);

        uiStore.dispatch({
            type: 'SOCKET CLOSED'
        });
    };

    socket.onmessage = (event) => {
        const action = JSON.parse(event.data);

        // console.log("From socket:", action);

        uiStore.dispatch(action);

        // console.log("Here's state after update:", uiStore.getState());
    };
};

export const socketMaintenance = (store => next => action => {
    if(action.type === 'INIT SOCKET') {
        createAndDispatchSocket(store);

        return;
    }
    else if(action.type === 'SOCKET CLOSED') {
        setTimeout(() => createAndDispatchSocket(store), 1500);
    }

    next(action);
});
