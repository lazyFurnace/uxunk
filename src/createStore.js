/**
 * react-uxunk 
 * 按照 redux 源码进行仿制
 * 发布/订阅模式
 * 拥有 redux 的几乎所有功能
 * @param {Function} reducer 用于存放所有的数据处理逻辑
 * 
 * @param {Object} defaultState 默认的初始化 state
 * 
 * @param {Function} enhancer 为 redux 提供所有中间件
 * 
 * @return {Object} 返回 store 里面包含 redux 所有数据及方法
 */
export default function createStore(reducer, defaultState, enhancer) {
    // state 中存放所有数据
    let state = defaultState;
    let currentReducer = reducer;

    /*
     * eventQueue 存放所有发布\订阅的函数
     * eventQueue = {
     *  type: [fn, fn, fn, ...],
     *  ...
     * }
     */
    const eventQueue = {};

    /*
     * 用于处理传入的 type 和 action
     * type 为所触发订阅的类型 action 为修改数据所需要的参数，是一个对象 必须有type属性
     * dispatch 函数作用是将 当前数据、订阅类型、修改数据的 action 传入 reducer 中
     * reducer 返回修改后的所有数据 并触发当前订阅类型下发布给所有订阅的函数
     */
    function dispatch(type, action) {
        state = currentReducer(state, type, action);
        this.trigger(type);
    }

    // 获取当前所有数据
    function getState() {
        return JSON.parse(JSON.stringify(state));
    }

    // 绑定订阅类别、监听函数
    // 返回函数用于接触订阅
    function subscribe(name, fn) {
        if (!fn) return false;
        if (!eventQueue[name]) {
            eventQueue[name] = [fn];
        } else if (eventQueue[name] && !eventQueue[name].some(item => item === fn)) {
            eventQueue[name].push(fn);
        } else {
            throw Error('This function has been subscribed!');
        }
        return function unsubscribe() {
            if (!eventQueue[name]) return;

            const index = eventQueue[name].indexOf(fn);
            eventQueue[name].splice(index, 1);

            if (eventQueue[name].length === 0) {
                delete eventQueue[name];
            }
        };
    }
    // 触发订阅类型的所有订阅了的函数
    function trigger(name, action) {
        if (eventQueue[name]) {
            eventQueue[name].forEach((item) => {
                item(action);
            });
        } else {
            throw Error('No related subscriptions!');
        }
    }
    // 删除该订阅类型下的所有函数
    function remove(name) {
        if (eventQueue[name]) {
            delete eventQueue[name];
        } else {
            throw Error('No related subscriptions!');
        }
    }
    // 替换reducer
    function replaceReducer(newReducer) {
        currentReducer = newReducer;
    }
    return {
        subscribe,
        dispatch,
        getState,
        replaceReducer,
        trigger,
        remove
    };
}
