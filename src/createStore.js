// react-uxunk
/*
 * uxunk 基于观察者模式、发布/订阅，参考的redux
 * uxunk 接收两个参数 reducer 和 defaultState
 * reducer 是处理以后所有数据关系的函数
 * defaultState 是默认的数据
 */
function createStore(reducer, defaultState) {
    // state 中存放所有数据
    let state = defaultState;

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
        state = reducer(state, type, action);
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
    return {
        subscribe,
        dispatch,
        getState,
        trigger,
        remove
    };
}

export default createStore;
