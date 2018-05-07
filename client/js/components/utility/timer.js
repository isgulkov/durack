
export const getTimeString = nSecs => {
    if(nSecs === null) {
        return "--:--";
    }

    if(nSecs < 0) {
        nSecs = 0;
    }

    const minutes = Math.floor(nSecs / 60);
    const seconds = Math.floor(nSecs % 60);

    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
};
