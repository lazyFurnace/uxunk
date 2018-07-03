function combineReducers(reducers = {}) {
    return function combination(state = {}, action) {
        return Object.keys(reducers).map(key => (
            reducers[key](state[key], action)
        ));
    };
}

export default combineReducers;
