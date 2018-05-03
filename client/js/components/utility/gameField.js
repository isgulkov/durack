
const allHandCenters = [
    {x: 100, y: 325},
    {x: 125, y: 150},
    {x: 300, y: 75},
    {x: 500, y: 75},
    {x: 700, y: 75},
    {x: 1000 - 125, y: 150},
    {x: 1000 - 100, y: 325}
];

const getOpponentHandCenters = numPlayers => {
    switch(numPlayers) {
        case 2:
            return [allHandCenters[3]];
        case 3:
            return [allHandCenters[1], allHandCenters[5]];
        case 4:
            return [allHandCenters[0], allHandCenters[3], allHandCenters[6]];
        case 5:
            return [allHandCenters[0], allHandCenters[2], allHandCenters[4], allHandCenters[6]];
        case 6:
            return [allHandCenters[0], allHandCenters[1], allHandCenters[3], allHandCenters[5], allHandCenters[6]];
        default:
            return null;
    }
};

export { getOpponentHandCenters };
