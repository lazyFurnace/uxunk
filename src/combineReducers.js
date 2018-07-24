/**
 * combineReducers 实现
 * 函数的作用是将多个 reducer 按照 key: value 组成一个更大的 reducer
 * 接收一个参数 reducers
 *
 * @param {Object} reducers 是将多个 reducer 组合成的对象
 *
 * @return {Function} 返回真正替代 reducer 的函数
 */
export default function combineReducers(reducers = {}) {
    /**
     * combineReducers 函数返回一个 function
     * 这个函数是真正的 reducer 接收两个参数
     *
     * @param {Object} state 这个是整体的默认状态
     * @param {Object} action 用来触发 reducer 的对象，必有字段 action.type
     *
     * @return {Object} 返回完成的 state
     */
    return function combination(state = {}, action) {
        /**
         * 遍历 reducers 的所有属性，取得所有的 reducer
         * 为每个 reducer 传入对应的 state 和 所触发的 action
         * 将对应返回的 state 放入 nextState 中
         * 返回 nextState
         */
        const nextState = {};
        Object.keys(reducers).forEach((key) => {
            nextState[key] = reducers[key](state[key], action);
        });
        return nextState;
    };
}

// ---- 找机会写个单元测试 ----

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
