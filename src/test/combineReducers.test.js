import combineReducers from '../combineReducers';

// 模拟 state
let stateSimulation = {
    loginState: {
        login: false,
        name: '',
        id: null
    },
    indexState: {
        shopBoy: false,
        goodGirl: false,
        text: ''
    }
};

// 模拟 actionType
const loginActionType = 'LOGIN/ACTION';
const indexActionType = 'INDEX/ACTION';

// 模拟 action
const loginAction = {
    type: loginActionType,
    name: '梅乐凯',
    id: 1
};
const indexAction = {
    type: indexActionType,
    isPeople: true,
    text: '愚蠢的人类啊！'
};

// 模拟 reducer
function loginReducer(state, action) {
    switch (action.type) {
    case loginActionType:
        return {
            login: true,
            name: action.name,
            id: action.id
        };
    default:
        return state;
    }
}

function indexReducer(state, action) {
    switch (action.type) {
    case indexActionType:
        return {
            shopBoy: action.isPeople,
            goodGirl: action.isPeople,
            text: action.text
        };
    default:
        return state;
    }
}

// 组合 reducers
const text = combineReducers({
    loginState: loginReducer,
    indexState: indexReducer
});

stateSimulation = text(stateSimulation, loginAction);
console.log(stateSimulation);

stateSimulation = text(stateSimulation, indexAction);
console.log(stateSimulation);
