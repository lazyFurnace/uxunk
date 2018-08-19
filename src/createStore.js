/**
 * uxunk
 * 按照 redux 源码进行仿制
 * 发布/订阅模式
 * 拥有 redux 的几乎所有功能
 * @param {Function} reducer 用于存放所有的数据处理逻辑，返回下一个state树
 *
 * @param {Object} defaultState 默认的初始化 state
 *
 * @param {Function} enhancer 为 redux 提供所有中间件，只能使用'applyMiddleware'方法来生成
 *
 * @return {Object} 返回 store 里面包含 redux 所有数据及方法
 */
export default function createStore(reducer, defaultState, enhancer) {
    // 判断是不是没有 defaultState 只有 enhancer 如果是这样就交换一下
    if (typeof enhancer === 'undefined' && typeof defaultState === 'function') {
        enhancer = defaultState;
        defaultState = undefined;
    }
    // 如果有中间件就在中间件中执行 createStore
    if (typeof enhancer === 'function') {
        return enhancer(createStore)(reducer, defaultState);
    }

    let currentState = defaultState;
    let currentReducer = reducer;
    const currentListeners = [];

    /**
     * dispatch 函数，执行 reducer ，触发所有 listener
     *
     * @param {Object} action 触发发布/订阅的事件
     *
     * @return {Object} 执行后返回 action
     */
    function dispatch(action) {
        /**
         * 内置 redux-thunk
         * 判断如果 action 是一个 function 就执行它
         */
        if (typeof action === 'function') {
            action();
            return false;
        }
        currentState = currentReducer(currentState, action);
        currentListeners.forEach(item => item());
        return action;
    }

    /**
     * getState 函数，返回经过深克隆的 state 树
     */
    function getState() {
        return JSON.parse(JSON.stringify(currentState));
    }

    /**
     * subscribe 函数，用于绑定 触发 dispatch 更新 state 时触发的函数
     *
     * @param {Function} fn 传入需要加入 listeners 绑定的函数
     *
     * @return {Function} 解除改函数绑定的方法
     */
    function subscribe(fn) {
        // 如果 fn 没有或不是一个 function 抛出错误
        if (!fn || typeof fn !== 'function') {
            throw Error('This function has been subscribed!');
        }
        // listeners 里没有这个时，加进去
        if (currentListeners.indexOf(fn) < 0) {
            currentListeners.push(fn);
        }
        // 返回解除 listeners 绑定的方法
        return function unsubscribe() {
            const index = currentListeners.indexOf(fn);
            if (index > 0) {
                currentListeners.splice(index, 1);
            }
        };
    }

    /**
     * replaceReducer 函数，接收一个新的 reducer 代替旧的
     *
     * @param {Function} newReducer 新的 reducer
     */
    function replaceReducer(newReducer) {
        currentReducer = newReducer;
    }
    return {
        subscribe,
        dispatch,
        getState,
        replaceReducer
    };
}
