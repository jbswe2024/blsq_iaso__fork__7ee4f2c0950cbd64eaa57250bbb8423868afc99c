const convertRoundDataToArray = roundDataAsDict => {
    const districtNames = Object.keys(roundDataAsDict);
    const roundData = Object.values(roundDataAsDict);
    return roundData.map((value, index) => {
        return { ...value, name: districtNames[index] };
    });
};

export const convertAPIData = data => {
    if (!data) return {};
    const { stats } = data;
    const campaignKeys = Object.keys(stats);
    const result = {};
    campaignKeys.forEach(key => {
        if (stats[key]) {
            result[key] = {};
            result[key].round_1 = convertRoundDataToArray(stats[key].round_1);
            result[key].round_2 = convertRoundDataToArray(stats[key].round_2);
        }
    });
    return result;
};