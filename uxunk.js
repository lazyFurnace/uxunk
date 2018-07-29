(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.uxunk = {})));
}(this, (function (exports) { 'use strict';

    /**
     * compose 实现
     * 函数作用是将多个函数通过函数式编程的方式组合起来
     * 组合成一个可以链式调用的函数并返回它
     * 执行返回的函数将从 func 的最后一个函数开始调用
     * 倒数第二个函数以最后一个函数的返回值为参数开始执行，以此来推...
     *
     * @param {...Function} funcs 将所有传入的参数合成一个数组，每一个参数都是一个 function
     *
     * @return {Function} 返回一个经过 reduce 组合后的函数，类似于 a(b(c(d(...arg))))
     */
    function compose(...funcs) {
        /**
         * 将 func 通过 reduce 组合起来
         * 例如 func = [a, b, c]
         * 第一次经过 reduce 返回结果 (...arg) => a(b(...arg))
         * 第二次经过 reduce 返回结果 (...arg) => ((...arg) => a(b(...arg)))(c(...arg))
         * 等于 (...arg) => a(b(c(...arg)))
         * 当我们执行这个结果时先执行 c 然后以 c 的结果执行 b...
         */
        return funcs.reduce((a, b) => (...arg) => a(b(...arg)));
    }

    // ---- 找机会写个单元测试 ----

    // 模拟三个函数
    function a1(data) {
        console.log(`a ${data}`);
        return data;
    }
    function b1(data) {
        console.log(`b ${data}`);
        return data;
    }
    function c1(data) {
        console.log(`c ${data}`);
        return data;
    }

    const test = compose(a1, b1, c1);

    /**
     * applyMiddleware 实现
     * 函数的作用是将你在 redux 中用到的所有中间件组合起来
     * 等待触发 dispatch 时依次触发所有中间件
     * 接收一个参数 middlewares 中间件们
     * @param {...Function} middlewares 所有中间件都是函数
     * 
     * @return {Function} 返回一个可以接收 createStore 的函数 
     * 在使用这个函数的情况下 store 的创建将在这个函数中进行
     */
    function applyMiddleware(...middlewares) {
        /**
         * 配合 createStore 中的 enhancer 来实现有中间件的 store 的创建
         * 有中间件的 store 会在触发 dispatch 后，执行 reducer 前执行所有的中间件
         * applyMiddleware 返回的是一个柯里化的函数
         * 第一次接收 redux 的 createStore
         * 第二次接收创建 store 所需要的 reducer 和 preloadedState
         * 两次接收后创建 store
         */
        return (createStore) => (...arg) => {
            /**
             * 讲一下中间件的格式，中间件是一个柯里化的函数
             * ({ dispatch, getState }) => next => action => { ... }
             * 第一层接收一个对象，里面是 getState 和 dispatch 方法
             * 第二层接收 next 是下一个中间件的函数，如果是最后一个 next 就是 store 的 dispatch 方法(不是后面声明的那个)
             * 第三层就是触发 dispatch 的 action 和我们了解的 redux 一样
             */
            const store = createStore(...arg);
            /**
             * 写一个空的 dispatch 函数，这个 dispatch 将是用来链式触发中间件的 dispatch 方法
             * 这个 dispatch 不是真正 store 上的 dispatch，而是触发所有中间件的 dispatch
             * 声明 middlewareAPI 里面是所有中间件都需要用到的 getState 和 dispatch 方法
             * 在中间件中调用这里的 dispatch 方法将会重新走一遍所有中间件
             */
            let dispatch = () => {};

            const middlewareAPI = {
                getState: store.getState,
                dispatch: (...arg) => dispatch(...arg)
            };
            /**
             * 遍历传入的所有中间件，执行所有中间件的第一层函数，传入 getState 和 dispatch 方法
             */
            const chain = middlewares.map((middleware) => middleware(middlewareAPI));
            /**
             * 我们将这部分拆开来看，首先 compose(...chain)
             * 经过这一步我们得到的是 (...arg) => 中间件1(中间件2(中间件3(...arg))) 这样的函数
             * compose(...chain)(store.dispatch)
             * arg = store.dispatch 中间件3的 next 就是 store.dispatch 函数，中间件3返回的函数 action => { ... }
             * 中间件2接收中间件3返回的 action => { ... } 作为中间件2的 next 然后返回自己的 action => { ... }
             * 最后返回中间件1的 action => { ... } ，中间件1的 next 是中间件2的 action => { ... } ,依次类推... 
             * 当我们执行中间件1的 action => { ... } 中触发中间件1的 next 开始执行中间件2的 action => { ... } ,依次类推... 
             * 最后执行中间件3的 next ，调用了 store.dispatch 函数
             * 相当于这个 dispatch 是用来触发所有中间件的，执行完所有中间件后，将执行真正的 store.dispatch 函数
             */
            dispatch = compose(...chain)(store.dispatch);

            /**
             * 将 store 的其他函数与经过封装的 dispatch 一同返回，形成新的完整的 store
             */
            return {
                dispatch,
                ...store
            }
        }
    }

    // ---- 找机会写个单元测试(因为这个模块需要配合 createStore 所以在这里只单独对功能经行测试) ----

    // 模拟 compose
    function simulationCompose(...funs) {
        return funs.reduce((a, b) => (...arg) => a(b(...arg)));
    }

    // 三个中间件
    function thunk() {
        return (next) => {
            console.log('thunk 外层函数执行');
            console.log(next);

            return (action) => {
                console.log('这是 thunk 函数');

                return next(action);
            };
        };
    }
    function logger() {
        return (next) => {
            console.log('logger 外层函数执行');
            console.log(next);

            return (action) => {
                console.log('这是 logger 函数');

                return next(action);
            };
        };
    }
    function bugger() {
        return (next) => {
            console.log('bugger 外层函数执行');
            console.log(next);

            return (action) => {
                console.log('这是 bugger 函数');

                return next(action);
            };
        };
    }

    // 模拟 applyMiddleware 执行过程
    const middlewares = [thunk, logger, bugger];
    const chain = middlewares.map(middleware => middleware());

    const dispatch = (data) => {
        console.log(data);
        return '执行完成返回 action';
    };

    const test$1 = simulationCompose(...chain)(dispatch);

    test$1('applyMiddleware 测试');

    /**
     * bindActionCreators 实现
     * 函数的作用是将生成 action 的方法，与 dispatch 结合传递给子元素等
     * 接收两个参数 actionCreators 和 dispatch
     *
     * @param {Object} actionCreators 是一个或多个生成 action 的函数组成的 object
     *
     * @param {Function} dispatch 由 redux 的 createStore 生成的触发发布/订阅的方法
     *
     * @return {Object} 返回一个已经在每一个 actionCreator 上绑定了 dispatch 方法的对象
     */
    function bindActionCreators(actionCreators, dispatch) {
        /**
         * 创建 boundActionCreators 作为将要返回的对象
         * 遍历 actionCreators 的所有属性，获取 actionCreator
         * 写一个方法执行，接收通过 actionCreator 生成 action 所需要的参数 arg
         * dispatch 和 actionCreator 由于闭包一直存在
         * 调用 (...arg) => dispatch(actionCreator(...arg)) 时
         * actionCreator(...arg) 返回 action
         * dispatch(action) 触发发布/订阅
         */
        const boundActionCreators = {};
        Object.keys(actionCreators).forEach((item) => {
            const actionCreator = actionCreators[item];
            boundActionCreators[item] = (...arg) => dispatch(actionCreator(...arg));
        });
        return boundActionCreators;
    }

    // ---- 找机会写个单元测试 ----

    // 模拟 actionCreator
    function addTodo(text) {
        return {
            type: 'ADD_TODO',
            text
        };
    }

    function removeTodo(id) {
        return {
            type: 'REMOVE_TODO',
            id
        };
    }

    // 模拟 actionCreators
    const actionCreators = { addTodo, removeTodo };

    // 模拟 dispatch
    function simulationDispatch(action) {
        console.log(action);
        const result = `你触发了 ${action.type} 的 action`;
        return result;
    }

    const test$2 = bindActionCreators(actionCreators, simulationDispatch);

    /**
     * combineReducers 实现
     * 函数的作用是将多个 reducer 按照 key: value 组成一个更大的 reducer
     * 接收一个参数 reducers
     *
     * @param {Object} reducers 是将多个 reducer 组合成的对象
     *
     * @return {Function} 返回真正替代 reducer 的函数
     */
    function combineReducers(reducers = {}) {
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

    exports.applyMiddleware = applyMiddleware;
    exports.bindActionCreators = bindActionCreators;
    exports.combineReducers = combineReducers;
    exports.compose = compose;
    exports.createStore = createStore;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXh1bmsuanMiLCJzb3VyY2VzIjpbInNyYy9jb21wb3NlLmpzIiwic3JjL2FwcGx5TWlkZGxld2FyZS5qcyIsInNyYy9iaW5kQWN0aW9uQ3JlYXRvcnMuanMiLCJzcmMvY29tYmluZVJlZHVjZXJzLmpzIiwic3JjL2NyZWF0ZVN0b3JlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBjb21wb3NlIOWunueOsFxyXG4gKiDlh73mlbDkvZznlKjmmK/lsIblpJrkuKrlh73mlbDpgJrov4flh73mlbDlvI/nvJbnqIvnmoTmlrnlvI/nu4TlkIjotbfmnaVcclxuICog57uE5ZCI5oiQ5LiA5Liq5Y+v5Lul6ZO+5byP6LCD55So55qE5Ye95pWw5bm26L+U5Zue5a6DXHJcbiAqIOaJp+ihjOi/lOWbnueahOWHveaVsOWwhuS7jiBmdW5jIOeahOacgOWQjuS4gOS4quWHveaVsOW8gOWni+iwg+eUqFxyXG4gKiDlgJLmlbDnrKzkuozkuKrlh73mlbDku6XmnIDlkI7kuIDkuKrlh73mlbDnmoTov5Tlm57lgLzkuLrlj4LmlbDlvIDlp4vmiafooYzvvIzku6XmraTmnaXmjqguLi5cclxuICpcclxuICogQHBhcmFtIHsuLi5GdW5jdGlvbn0gZnVuY3Mg5bCG5omA5pyJ5Lyg5YWl55qE5Y+C5pWw5ZCI5oiQ5LiA5Liq5pWw57uE77yM5q+P5LiA5Liq5Y+C5pWw6YO95piv5LiA5LiqIGZ1bmN0aW9uXHJcbiAqXHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSDov5Tlm57kuIDkuKrnu4/ov4cgcmVkdWNlIOe7hOWQiOWQjueahOWHveaVsO+8jOexu+S8vOS6jiBhKGIoYyhkKC4uLmFyZykpKSlcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbXBvc2UoLi4uZnVuY3MpIHtcclxuICAgIC8qKlxyXG4gICAgICog5bCGIGZ1bmMg6YCa6L+HIHJlZHVjZSDnu4TlkIjotbfmnaVcclxuICAgICAqIOS+i+WmgiBmdW5jID0gW2EsIGIsIGNdXHJcbiAgICAgKiDnrKzkuIDmrKHnu4/ov4cgcmVkdWNlIOi/lOWbnue7k+aenCAoLi4uYXJnKSA9PiBhKGIoLi4uYXJnKSlcclxuICAgICAqIOesrOS6jOasoee7j+i/hyByZWR1Y2Ug6L+U5Zue57uT5p6cICguLi5hcmcpID0+ICgoLi4uYXJnKSA9PiBhKGIoLi4uYXJnKSkpKGMoLi4uYXJnKSlcclxuICAgICAqIOetieS6jiAoLi4uYXJnKSA9PiBhKGIoYyguLi5hcmcpKSlcclxuICAgICAqIOW9k+aIkeS7rOaJp+ihjOi/meS4que7k+aenOaXtuWFiOaJp+ihjCBjIOeEtuWQjuS7pSBjIOeahOe7k+aenOaJp+ihjCBiLi4uXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBmdW5jcy5yZWR1Y2UoKGEsIGIpID0+ICguLi5hcmcpID0+IGEoYiguLi5hcmcpKSk7XHJcbn1cclxuXHJcbi8vIC0tLS0g5om+5py65Lya5YaZ5Liq5Y2V5YWD5rWL6K+VIC0tLS1cclxuXHJcbi8vIOaooeaLn+S4ieS4quWHveaVsFxyXG5mdW5jdGlvbiBhMShkYXRhKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgYSAke2RhdGF9YCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxufVxyXG5mdW5jdGlvbiBiMShkYXRhKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgYiAke2RhdGF9YCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxufVxyXG5mdW5jdGlvbiBjMShkYXRhKSB7XHJcbiAgICBjb25zb2xlLmxvZyhgYyAke2RhdGF9YCk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxufVxyXG5cclxuY29uc3QgdGVzdCA9IGNvbXBvc2UoYTEsIGIxLCBjMSk7XHJcbiIsImltcG9ydCBjb21wb3NlIGZyb20gJy4vY29tcG9zZSc7XHJcbi8qKlxyXG4gKiBhcHBseU1pZGRsZXdhcmUg5a6e546wXHJcbiAqIOWHveaVsOeahOS9nOeUqOaYr+WwhuS9oOWcqCByZWR1eCDkuK3nlKjliLDnmoTmiYDmnInkuK3pl7Tku7bnu4TlkIjotbfmnaVcclxuICog562J5b6F6Kem5Y+RIGRpc3BhdGNoIOaXtuS+neasoeinpuWPkeaJgOacieS4remXtOS7tlxyXG4gKiDmjqXmlLbkuIDkuKrlj4LmlbAgbWlkZGxld2FyZXMg5Lit6Ze05Lu25LusXHJcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IG1pZGRsZXdhcmVzIOaJgOacieS4remXtOS7tumDveaYr+WHveaVsFxyXG4gKiBcclxuICogQHJldHVybiB7RnVuY3Rpb259IOi/lOWbnuS4gOS4quWPr+S7peaOpeaUtiBjcmVhdGVTdG9yZSDnmoTlh73mlbAgXHJcbiAqIOWcqOS9v+eUqOi/meS4quWHveaVsOeahOaDheWGteS4iyBzdG9yZSDnmoTliJvlu7rlsIblnKjov5nkuKrlh73mlbDkuK3ov5vooYxcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFwcGx5TWlkZGxld2FyZSguLi5taWRkbGV3YXJlcykge1xyXG4gICAgLyoqXHJcbiAgICAgKiDphY3lkIggY3JlYXRlU3RvcmUg5Lit55qEIGVuaGFuY2VyIOadpeWunueOsOacieS4remXtOS7tueahCBzdG9yZSDnmoTliJvlu7pcclxuICAgICAqIOacieS4remXtOS7tueahCBzdG9yZSDkvJrlnKjop6blj5EgZGlzcGF0Y2gg5ZCO77yM5omn6KGMIHJlZHVjZXIg5YmN5omn6KGM5omA5pyJ55qE5Lit6Ze05Lu2XHJcbiAgICAgKiBhcHBseU1pZGRsZXdhcmUg6L+U5Zue55qE5piv5LiA5Liq5p+v6YeM5YyW55qE5Ye95pWwXHJcbiAgICAgKiDnrKzkuIDmrKHmjqXmlLYgcmVkdXgg55qEIGNyZWF0ZVN0b3JlXHJcbiAgICAgKiDnrKzkuozmrKHmjqXmlLbliJvlu7ogc3RvcmUg5omA6ZyA6KaB55qEIHJlZHVjZXIg5ZKMIHByZWxvYWRlZFN0YXRlXHJcbiAgICAgKiDkuKTmrKHmjqXmlLblkI7liJvlu7ogc3RvcmVcclxuICAgICAqL1xyXG4gICAgcmV0dXJuIChjcmVhdGVTdG9yZSkgPT4gKC4uLmFyZykgPT4ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiusuS4gOS4i+S4remXtOS7tueahOagvOW8j++8jOS4remXtOS7tuaYr+S4gOS4quafr+mHjOWMlueahOWHveaVsFxyXG4gICAgICAgICAqICh7IGRpc3BhdGNoLCBnZXRTdGF0ZSB9KSA9PiBuZXh0ID0+IGFjdGlvbiA9PiB7IC4uLiB9XHJcbiAgICAgICAgICog56ys5LiA5bGC5o6l5pS25LiA5Liq5a+56LGh77yM6YeM6Z2i5pivIGdldFN0YXRlIOWSjCBkaXNwYXRjaCDmlrnms5VcclxuICAgICAgICAgKiDnrKzkuozlsYLmjqXmlLYgbmV4dCDmmK/kuIvkuIDkuKrkuK3pl7Tku7bnmoTlh73mlbDvvIzlpoLmnpzmmK/mnIDlkI7kuIDkuKogbmV4dCDlsLHmmK8gc3RvcmUg55qEIGRpc3BhdGNoIOaWueazlSjkuI3mmK/lkI7pnaLlo7DmmI7nmoTpgqPkuKopXHJcbiAgICAgICAgICog56ys5LiJ5bGC5bCx5piv6Kem5Y+RIGRpc3BhdGNoIOeahCBhY3Rpb24g5ZKM5oiR5Lus5LqG6Kej55qEIHJlZHV4IOS4gOagt1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHN0b3JlID0gY3JlYXRlU3RvcmUoLi4uYXJnKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDlhpnkuIDkuKrnqbrnmoQgZGlzcGF0Y2gg5Ye95pWw77yM6L+Z5LiqIGRpc3BhdGNoIOWwhuaYr+eUqOadpemTvuW8j+inpuWPkeS4remXtOS7tueahCBkaXNwYXRjaCDmlrnms5VcclxuICAgICAgICAgKiDov5nkuKogZGlzcGF0Y2gg5LiN5piv55yf5q2jIHN0b3JlIOS4iueahCBkaXNwYXRjaO+8jOiAjOaYr+inpuWPkeaJgOacieS4remXtOS7tueahCBkaXNwYXRjaFxyXG4gICAgICAgICAqIOWjsOaYjiBtaWRkbGV3YXJlQVBJIOmHjOmdouaYr+aJgOacieS4remXtOS7tumDvemcgOimgeeUqOWIsOeahCBnZXRTdGF0ZSDlkowgZGlzcGF0Y2gg5pa55rOVXHJcbiAgICAgICAgICog5Zyo5Lit6Ze05Lu25Lit6LCD55So6L+Z6YeM55qEIGRpc3BhdGNoIOaWueazleWwhuS8mumHjeaWsOi1sOS4gOmBjeaJgOacieS4remXtOS7tlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGxldCBkaXNwYXRjaCA9ICgpID0+IHt9O1xyXG5cclxuICAgICAgICBjb25zdCBtaWRkbGV3YXJlQVBJID0ge1xyXG4gICAgICAgICAgICBnZXRTdGF0ZTogc3RvcmUuZ2V0U3RhdGUsXHJcbiAgICAgICAgICAgIGRpc3BhdGNoOiAoLi4uYXJnKSA9PiBkaXNwYXRjaCguLi5hcmcpXHJcbiAgICAgICAgfTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDpgY3ljobkvKDlhaXnmoTmiYDmnInkuK3pl7Tku7bvvIzmiafooYzmiYDmnInkuK3pl7Tku7bnmoTnrKzkuIDlsYLlh73mlbDvvIzkvKDlhaUgZ2V0U3RhdGUg5ZKMIGRpc3BhdGNoIOaWueazlVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IGNoYWluID0gbWlkZGxld2FyZXMubWFwKChtaWRkbGV3YXJlKSA9PiBtaWRkbGV3YXJlKG1pZGRsZXdhcmVBUEkpKTtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDmiJHku6zlsIbov5npg6jliIbmi4blvIDmnaXnnIvvvIzpppblhYggY29tcG9zZSguLi5jaGFpbilcclxuICAgICAgICAgKiDnu4/ov4fov5nkuIDmraXmiJHku6zlvpfliLDnmoTmmK8gKC4uLmFyZykgPT4g5Lit6Ze05Lu2MSjkuK3pl7Tku7YyKOS4remXtOS7tjMoLi4uYXJnKSkpIOi/meagt+eahOWHveaVsFxyXG4gICAgICAgICAqIGNvbXBvc2UoLi4uY2hhaW4pKHN0b3JlLmRpc3BhdGNoKVxyXG4gICAgICAgICAqIGFyZyA9IHN0b3JlLmRpc3BhdGNoIOS4remXtOS7tjPnmoQgbmV4dCDlsLHmmK8gc3RvcmUuZGlzcGF0Y2gg5Ye95pWw77yM5Lit6Ze05Lu2M+i/lOWbnueahOWHveaVsCBhY3Rpb24gPT4geyAuLi4gfVxyXG4gICAgICAgICAqIOS4remXtOS7tjLmjqXmlLbkuK3pl7Tku7Yz6L+U5Zue55qEIGFjdGlvbiA9PiB7IC4uLiB9IOS9nOS4uuS4remXtOS7tjLnmoQgbmV4dCDnhLblkI7ov5Tlm57oh6rlt7HnmoQgYWN0aW9uID0+IHsgLi4uIH1cclxuICAgICAgICAgKiDmnIDlkI7ov5Tlm57kuK3pl7Tku7Yx55qEIGFjdGlvbiA9PiB7IC4uLiB9IO+8jOS4remXtOS7tjHnmoQgbmV4dCDmmK/kuK3pl7Tku7Yy55qEIGFjdGlvbiA9PiB7IC4uLiB9ICzkvp3mrKHnsbvmjqguLi4gXHJcbiAgICAgICAgICog5b2T5oiR5Lus5omn6KGM5Lit6Ze05Lu2MeeahCBhY3Rpb24gPT4geyAuLi4gfSDkuK3op6blj5HkuK3pl7Tku7Yx55qEIG5leHQg5byA5aeL5omn6KGM5Lit6Ze05Lu2MueahCBhY3Rpb24gPT4geyAuLi4gfSAs5L6d5qyh57G75o6oLi4uIFxyXG4gICAgICAgICAqIOacgOWQjuaJp+ihjOS4remXtOS7tjPnmoQgbmV4dCDvvIzosIPnlKjkuoYgc3RvcmUuZGlzcGF0Y2gg5Ye95pWwXHJcbiAgICAgICAgICog55u45b2T5LqO6L+Z5LiqIGRpc3BhdGNoIOaYr+eUqOadpeinpuWPkeaJgOacieS4remXtOS7tueahO+8jOaJp+ihjOWujOaJgOacieS4remXtOS7tuWQju+8jOWwhuaJp+ihjOecn+ato+eahCBzdG9yZS5kaXNwYXRjaCDlh73mlbBcclxuICAgICAgICAgKi9cclxuICAgICAgICBkaXNwYXRjaCA9IGNvbXBvc2UoLi4uY2hhaW4pKHN0b3JlLmRpc3BhdGNoKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5bCGIHN0b3JlIOeahOWFtuS7luWHveaVsOS4jue7j+i/h+WwgeijheeahCBkaXNwYXRjaCDkuIDlkIzov5Tlm57vvIzlvaLmiJDmlrDnmoTlrozmlbTnmoQgc3RvcmVcclxuICAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkaXNwYXRjaCxcclxuICAgICAgICAgICAgLi4uc3RvcmVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIC0tLS0g5om+5py65Lya5YaZ5Liq5Y2V5YWD5rWL6K+VKOWboOS4uui/meS4quaooeWdl+mcgOimgemFjeWQiCBjcmVhdGVTdG9yZSDmiYDku6XlnKjov5nph4zlj6rljZXni6zlr7nlip/og73nu4/ooYzmtYvor5UpIC0tLS1cclxuXHJcbi8vIOaooeaLnyBjb21wb3NlXHJcbmZ1bmN0aW9uIHNpbXVsYXRpb25Db21wb3NlKC4uLmZ1bnMpIHtcclxuICAgIHJldHVybiBmdW5zLnJlZHVjZSgoYSwgYikgPT4gKC4uLmFyZykgPT4gYShiKC4uLmFyZykpKTtcclxufVxyXG5cclxuLy8g5LiJ5Liq5Lit6Ze05Lu2XHJcbmZ1bmN0aW9uIHRodW5rKCkge1xyXG4gICAgcmV0dXJuIChuZXh0KSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RodW5rIOWkluWxguWHveaVsOaJp+ihjCcpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG5leHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gKGFjdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6L+Z5pivIHRodW5rIOWHveaVsCcpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5leHQoYWN0aW9uKTtcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBsb2dnZXIoKSB7XHJcbiAgICByZXR1cm4gKG5leHQpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnbG9nZ2VyIOWkluWxguWHveaVsOaJp+ihjCcpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG5leHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gKGFjdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6L+Z5pivIGxvZ2dlciDlh73mlbAnKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGFjdGlvbik7XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn1cclxuZnVuY3Rpb24gYnVnZ2VyKCkge1xyXG4gICAgcmV0dXJuIChuZXh0KSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2J1Z2dlciDlpJblsYLlh73mlbDmiafooYwnKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhuZXh0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIChhY3Rpb24pID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ+i/meaYryBidWdnZXIg5Ye95pWwJyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dChhY3Rpb24pO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyDmqKHmi58gYXBwbHlNaWRkbGV3YXJlIOaJp+ihjOi/h+eoi1xyXG5jb25zdCBtaWRkbGV3YXJlcyA9IFt0aHVuaywgbG9nZ2VyLCBidWdnZXJdO1xyXG5jb25zdCBjaGFpbiA9IG1pZGRsZXdhcmVzLm1hcChtaWRkbGV3YXJlID0+IG1pZGRsZXdhcmUoKSk7XHJcblxyXG5jb25zdCBkaXNwYXRjaCA9IChkYXRhKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgIHJldHVybiAn5omn6KGM5a6M5oiQ6L+U5ZueIGFjdGlvbic7XHJcbn07XHJcblxyXG5jb25zdCB0ZXN0ID0gc2ltdWxhdGlvbkNvbXBvc2UoLi4uY2hhaW4pKGRpc3BhdGNoKTtcclxuXHJcbnRlc3QoJ2FwcGx5TWlkZGxld2FyZSDmtYvor5UnKTtcclxuIiwiLyoqXHJcbiAqIGJpbmRBY3Rpb25DcmVhdG9ycyDlrp7njrBcclxuICog5Ye95pWw55qE5L2c55So5piv5bCG55Sf5oiQIGFjdGlvbiDnmoTmlrnms5XvvIzkuI4gZGlzcGF0Y2gg57uT5ZCI5Lyg6YCS57uZ5a2Q5YWD57Sg562JXHJcbiAqIOaOpeaUtuS4pOS4quWPguaVsCBhY3Rpb25DcmVhdG9ycyDlkowgZGlzcGF0Y2hcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGFjdGlvbkNyZWF0b3JzIOaYr+S4gOS4quaIluWkmuS4queUn+aIkCBhY3Rpb24g55qE5Ye95pWw57uE5oiQ55qEIG9iamVjdFxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkaXNwYXRjaCDnlLEgcmVkdXgg55qEIGNyZWF0ZVN0b3JlIOeUn+aIkOeahOinpuWPkeWPkeW4gy/orqLpmIXnmoTmlrnms5VcclxuICpcclxuICogQHJldHVybiB7T2JqZWN0fSDov5Tlm57kuIDkuKrlt7Lnu4/lnKjmr4/kuIDkuKogYWN0aW9uQ3JlYXRvciDkuIrnu5HlrprkuoYgZGlzcGF0Y2gg5pa55rOV55qE5a+56LGhXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBiaW5kQWN0aW9uQ3JlYXRvcnMoYWN0aW9uQ3JlYXRvcnMsIGRpc3BhdGNoKSB7XHJcbiAgICAvKipcclxuICAgICAqIOWIm+W7uiBib3VuZEFjdGlvbkNyZWF0b3JzIOS9nOS4uuWwhuimgei/lOWbnueahOWvueixoVxyXG4gICAgICog6YGN5Y6GIGFjdGlvbkNyZWF0b3JzIOeahOaJgOacieWxnuaAp++8jOiOt+WPliBhY3Rpb25DcmVhdG9yXHJcbiAgICAgKiDlhpnkuIDkuKrmlrnms5XmiafooYzvvIzmjqXmlLbpgJrov4cgYWN0aW9uQ3JlYXRvciDnlJ/miJAgYWN0aW9uIOaJgOmcgOimgeeahOWPguaVsCBhcmdcclxuICAgICAqIGRpc3BhdGNoIOWSjCBhY3Rpb25DcmVhdG9yIOeUseS6jumXreWMheS4gOebtOWtmOWcqFxyXG4gICAgICog6LCD55SoICguLi5hcmcpID0+IGRpc3BhdGNoKGFjdGlvbkNyZWF0b3IoLi4uYXJnKSkg5pe2XHJcbiAgICAgKiBhY3Rpb25DcmVhdG9yKC4uLmFyZykg6L+U5ZueIGFjdGlvblxyXG4gICAgICogZGlzcGF0Y2goYWN0aW9uKSDop6blj5Hlj5HluIMv6K6i6ZiFXHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGJvdW5kQWN0aW9uQ3JlYXRvcnMgPSB7fTtcclxuICAgIE9iamVjdC5rZXlzKGFjdGlvbkNyZWF0b3JzKS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgY29uc3QgYWN0aW9uQ3JlYXRvciA9IGFjdGlvbkNyZWF0b3JzW2l0ZW1dO1xyXG4gICAgICAgIGJvdW5kQWN0aW9uQ3JlYXRvcnNbaXRlbV0gPSAoLi4uYXJnKSA9PiBkaXNwYXRjaChhY3Rpb25DcmVhdG9yKC4uLmFyZykpO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gYm91bmRBY3Rpb25DcmVhdG9ycztcclxufVxyXG5cclxuLy8gLS0tLSDmib7mnLrkvJrlhpnkuKrljZXlhYPmtYvor5UgLS0tLVxyXG5cclxuLy8g5qih5oufIGFjdGlvbkNyZWF0b3JcclxuZnVuY3Rpb24gYWRkVG9kbyh0ZXh0KSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdBRERfVE9ETycsXHJcbiAgICAgICAgdGV4dFxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVtb3ZlVG9kbyhpZCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICB0eXBlOiAnUkVNT1ZFX1RPRE8nLFxyXG4gICAgICAgIGlkXHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyDmqKHmi58gYWN0aW9uQ3JlYXRvcnNcclxuY29uc3QgYWN0aW9uQ3JlYXRvcnMgPSB7IGFkZFRvZG8sIHJlbW92ZVRvZG8gfTtcclxuXHJcbi8vIOaooeaLnyBkaXNwYXRjaFxyXG5mdW5jdGlvbiBzaW11bGF0aW9uRGlzcGF0Y2goYWN0aW9uKSB7XHJcbiAgICBjb25zb2xlLmxvZyhhY3Rpb24pO1xyXG4gICAgY29uc3QgcmVzdWx0ID0gYOS9oOinpuWPkeS6hiAke2FjdGlvbi50eXBlfSDnmoQgYWN0aW9uYDtcclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn1cclxuXHJcbmNvbnN0IHRlc3QgPSBiaW5kQWN0aW9uQ3JlYXRvcnMoYWN0aW9uQ3JlYXRvcnMsIHNpbXVsYXRpb25EaXNwYXRjaCk7XHJcbiIsIi8qKlxyXG4gKiBjb21iaW5lUmVkdWNlcnMg5a6e546wXHJcbiAqIOWHveaVsOeahOS9nOeUqOaYr+WwhuWkmuS4qiByZWR1Y2VyIOaMieeFpyBrZXk6IHZhbHVlIOe7hOaIkOS4gOS4quabtOWkp+eahCByZWR1Y2VyXHJcbiAqIOaOpeaUtuS4gOS4quWPguaVsCByZWR1Y2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcmVkdWNlcnMg5piv5bCG5aSa5LiqIHJlZHVjZXIg57uE5ZCI5oiQ55qE5a+56LGhXHJcbiAqXHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSDov5Tlm57nnJ/mraPmm7/ku6MgcmVkdWNlciDnmoTlh73mlbBcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbWJpbmVSZWR1Y2VycyhyZWR1Y2VycyA9IHt9KSB7XHJcbiAgICAvKipcclxuICAgICAqIGNvbWJpbmVSZWR1Y2VycyDlh73mlbDov5Tlm57kuIDkuKogZnVuY3Rpb25cclxuICAgICAqIOi/meS4quWHveaVsOaYr+ecn+ato+eahCByZWR1Y2VyIOaOpeaUtuS4pOS4quWPguaVsFxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZSDov5nkuKrmmK/mlbTkvZPnmoTpu5jorqTnirbmgIFcclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBhY3Rpb24g55So5p2l6Kem5Y+RIHJlZHVjZXIg55qE5a+56LGh77yM5b+F5pyJ5a2X5q61IGFjdGlvbi50eXBlXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybiB7T2JqZWN0fSDov5Tlm57lrozmiJDnmoQgc3RhdGVcclxuICAgICAqL1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbWJpbmF0aW9uKHN0YXRlID0ge30sIGFjdGlvbikge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOmBjeWOhiByZWR1Y2VycyDnmoTmiYDmnInlsZ7mgKfvvIzlj5blvpfmiYDmnInnmoQgcmVkdWNlclxyXG4gICAgICAgICAqIOS4uuavj+S4qiByZWR1Y2VyIOS8oOWFpeWvueW6lOeahCBzdGF0ZSDlkowg5omA6Kem5Y+R55qEIGFjdGlvblxyXG4gICAgICAgICAqIOWwhuWvueW6lOi/lOWbnueahCBzdGF0ZSDmlL7lhaUgbmV4dFN0YXRlIOS4rVxyXG4gICAgICAgICAqIOi/lOWbniBuZXh0U3RhdGVcclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCBuZXh0U3RhdGUgPSB7fTtcclxuICAgICAgICBPYmplY3Qua2V5cyhyZWR1Y2VycykuZm9yRWFjaCgoa2V5KSA9PiB7XHJcbiAgICAgICAgICAgIG5leHRTdGF0ZVtrZXldID0gcmVkdWNlcnNba2V5XShzdGF0ZVtrZXldLCBhY3Rpb24pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBuZXh0U3RhdGU7XHJcbiAgICB9O1xyXG59XHJcblxyXG4vLyAtLS0tIOaJvuacuuS8muWGmeS4quWNleWFg+a1i+ivlSAtLS0tXHJcblxyXG4vLyDmqKHmi58gc3RhdGVcclxubGV0IHN0YXRlU2ltdWxhdGlvbiA9IHtcclxuICAgIGxvZ2luU3RhdGU6IHtcclxuICAgICAgICBsb2dpbjogZmFsc2UsXHJcbiAgICAgICAgbmFtZTogJycsXHJcbiAgICAgICAgaWQ6IG51bGxcclxuICAgIH0sXHJcbiAgICBpbmRleFN0YXRlOiB7XHJcbiAgICAgICAgc2hvcEJveTogZmFsc2UsXHJcbiAgICAgICAgZ29vZEdpcmw6IGZhbHNlLFxyXG4gICAgICAgIHRleHQ6ICcnXHJcbiAgICB9XHJcbn07XHJcblxyXG4vLyDmqKHmi58gYWN0aW9uVHlwZVxyXG5jb25zdCBsb2dpbkFjdGlvblR5cGUgPSAnTE9HSU4vQUNUSU9OJztcclxuY29uc3QgaW5kZXhBY3Rpb25UeXBlID0gJ0lOREVYL0FDVElPTic7XHJcblxyXG4vLyDmqKHmi58gYWN0aW9uXHJcbmNvbnN0IGxvZ2luQWN0aW9uID0ge1xyXG4gICAgdHlwZTogbG9naW5BY3Rpb25UeXBlLFxyXG4gICAgbmFtZTogJ+aiheS5kOWHrycsXHJcbiAgICBpZDogMVxyXG59O1xyXG5jb25zdCBpbmRleEFjdGlvbiA9IHtcclxuICAgIHR5cGU6IGluZGV4QWN0aW9uVHlwZSxcclxuICAgIGlzUGVvcGxlOiB0cnVlLFxyXG4gICAgdGV4dDogJ+aEmuigoueahOS6uuexu+WViu+8gSdcclxufTtcclxuXHJcbi8vIOaooeaLnyByZWR1Y2VyXHJcbmZ1bmN0aW9uIGxvZ2luUmVkdWNlcihzdGF0ZSwgYWN0aW9uKSB7XHJcbiAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XHJcbiAgICBjYXNlIGxvZ2luQWN0aW9uVHlwZTpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBsb2dpbjogdHJ1ZSxcclxuICAgICAgICAgICAgbmFtZTogYWN0aW9uLm5hbWUsXHJcbiAgICAgICAgICAgIGlkOiBhY3Rpb24uaWRcclxuICAgICAgICB9O1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4gc3RhdGU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGluZGV4UmVkdWNlcihzdGF0ZSwgYWN0aW9uKSB7XHJcbiAgICBzd2l0Y2ggKGFjdGlvbi50eXBlKSB7XHJcbiAgICBjYXNlIGluZGV4QWN0aW9uVHlwZTpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzaG9wQm95OiBhY3Rpb24uaXNQZW9wbGUsXHJcbiAgICAgICAgICAgIGdvb2RHaXJsOiBhY3Rpb24uaXNQZW9wbGUsXHJcbiAgICAgICAgICAgIHRleHQ6IGFjdGlvbi50ZXh0XHJcbiAgICAgICAgfTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyDnu4TlkIggcmVkdWNlcnNcclxuY29uc3QgdGV4dCA9IGNvbWJpbmVSZWR1Y2Vycyh7XHJcbiAgICBsb2dpblN0YXRlOiBsb2dpblJlZHVjZXIsXHJcbiAgICBpbmRleFN0YXRlOiBpbmRleFJlZHVjZXJcclxufSk7XHJcblxyXG5zdGF0ZVNpbXVsYXRpb24gPSB0ZXh0KHN0YXRlU2ltdWxhdGlvbiwgbG9naW5BY3Rpb24pO1xyXG5jb25zb2xlLmxvZyhzdGF0ZVNpbXVsYXRpb24pO1xyXG5cclxuc3RhdGVTaW11bGF0aW9uID0gdGV4dChzdGF0ZVNpbXVsYXRpb24sIGluZGV4QWN0aW9uKTtcclxuY29uc29sZS5sb2coc3RhdGVTaW11bGF0aW9uKTtcclxuIiwiLy8gcmVhY3QtdXh1bmtcclxuLypcclxuICogdXh1bmsg5Z+65LqO6KeC5a+f6ICF5qih5byP44CB5Y+R5biDL+iuoumYhe+8jOWPguiAg+eahHJlZHV4XHJcbiAqIHV4dW5rIOaOpeaUtuS4pOS4quWPguaVsCByZWR1Y2VyIOWSjCBkZWZhdWx0U3RhdGVcclxuICogcmVkdWNlciDmmK/lpITnkIbku6XlkI7miYDmnInmlbDmja7lhbPns7vnmoTlh73mlbBcclxuICogZGVmYXVsdFN0YXRlIOaYr+m7mOiupOeahOaVsOaNrlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlU3RvcmUocmVkdWNlciwgZGVmYXVsdFN0YXRlKSB7XHJcbiAgICAvLyBzdGF0ZSDkuK3lrZjmlL7miYDmnInmlbDmja5cclxuICAgIGxldCBzdGF0ZSA9IGRlZmF1bHRTdGF0ZTtcclxuICAgIGxldCBjdXJyZW50UmVkdWNlciA9IHJlZHVjZXI7XHJcblxyXG4gICAgLypcclxuICAgICAqIGV2ZW50UXVldWUg5a2Y5pS+5omA5pyJ5Y+R5biDXFzorqLpmIXnmoTlh73mlbBcclxuICAgICAqIGV2ZW50UXVldWUgPSB7XHJcbiAgICAgKiAgdHlwZTogW2ZuLCBmbiwgZm4sIC4uLl0sXHJcbiAgICAgKiAgLi4uXHJcbiAgICAgKiB9XHJcbiAgICAgKi9cclxuICAgIGNvbnN0IGV2ZW50UXVldWUgPSB7fTtcclxuXHJcbiAgICAvKlxyXG4gICAgICog55So5LqO5aSE55CG5Lyg5YWl55qEIHR5cGUg5ZKMIGFjdGlvblxyXG4gICAgICogdHlwZSDkuLrmiYDop6blj5HorqLpmIXnmoTnsbvlnosgYWN0aW9uIOS4uuS/ruaUueaVsOaNruaJgOmcgOimgeeahOWPguaVsO+8jOaYr+S4gOS4quWvueixoSDlv4XpobvmnIl0eXBl5bGe5oCnXHJcbiAgICAgKiBkaXNwYXRjaCDlh73mlbDkvZznlKjmmK/lsIYg5b2T5YmN5pWw5o2u44CB6K6i6ZiF57G75Z6L44CB5L+u5pS55pWw5o2u55qEIGFjdGlvbiDkvKDlhaUgcmVkdWNlciDkuK1cclxuICAgICAqIHJlZHVjZXIg6L+U5Zue5L+u5pS55ZCO55qE5omA5pyJ5pWw5o2uIOW5tuinpuWPkeW9k+WJjeiuoumYheexu+Wei+S4i+WPkeW4g+e7meaJgOacieiuoumYheeahOWHveaVsFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkaXNwYXRjaCh0eXBlLCBhY3Rpb24pIHtcclxuICAgICAgICBzdGF0ZSA9IGN1cnJlbnRSZWR1Y2VyKHN0YXRlLCB0eXBlLCBhY3Rpb24pO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcih0eXBlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyDojrflj5blvZPliY3miYDmnInmlbDmja5cclxuICAgIGZ1bmN0aW9uIGdldFN0YXRlKCkge1xyXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHN0YXRlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g57uR5a6a6K6i6ZiF57G75Yir44CB55uR5ZCs5Ye95pWwXHJcbiAgICAvLyDov5Tlm57lh73mlbDnlKjkuo7mjqXop6borqLpmIVcclxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShuYW1lLCBmbikge1xyXG4gICAgICAgIGlmICghZm4pIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoIWV2ZW50UXVldWVbbmFtZV0pIHtcclxuICAgICAgICAgICAgZXZlbnRRdWV1ZVtuYW1lXSA9IFtmbl07XHJcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFF1ZXVlW25hbWVdICYmICFldmVudFF1ZXVlW25hbWVdLnNvbWUoaXRlbSA9PiBpdGVtID09PSBmbikpIHtcclxuICAgICAgICAgICAgZXZlbnRRdWV1ZVtuYW1lXS5wdXNoKGZuKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBFcnJvcignVGhpcyBmdW5jdGlvbiBoYXMgYmVlbiBzdWJzY3JpYmVkIScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gdW5zdWJzY3JpYmUoKSB7XHJcbiAgICAgICAgICAgIGlmICghZXZlbnRRdWV1ZVtuYW1lXSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBldmVudFF1ZXVlW25hbWVdLmluZGV4T2YoZm4pO1xyXG4gICAgICAgICAgICBldmVudFF1ZXVlW25hbWVdLnNwbGljZShpbmRleCwgMSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZXZlbnRRdWV1ZVtuYW1lXS5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBldmVudFF1ZXVlW25hbWVdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICAgIC8vIOinpuWPkeiuoumYheexu+Wei+eahOaJgOacieiuoumYheS6hueahOWHveaVsFxyXG4gICAgZnVuY3Rpb24gdHJpZ2dlcihuYW1lLCBhY3Rpb24pIHtcclxuICAgICAgICBpZiAoZXZlbnRRdWV1ZVtuYW1lXSkge1xyXG4gICAgICAgICAgICBldmVudFF1ZXVlW25hbWVdLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIGl0ZW0oYWN0aW9uKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHJlbGF0ZWQgc3Vic2NyaXB0aW9ucyEnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDliKDpmaTor6XorqLpmIXnsbvlnovkuIvnmoTmiYDmnInlh73mlbBcclxuICAgIGZ1bmN0aW9uIHJlbW92ZShuYW1lKSB7XHJcbiAgICAgICAgaWYgKGV2ZW50UXVldWVbbmFtZV0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGV2ZW50UXVldWVbbmFtZV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ05vIHJlbGF0ZWQgc3Vic2NyaXB0aW9ucyEnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyDmm7/mjaJyZWR1Y2VyXHJcbiAgICBmdW5jdGlvbiByZXBsYWNlUmVkdWNlcihuZXdSZWR1Y2VyKSB7XHJcbiAgICAgICAgY3VycmVudFJlZHVjZXIgPSBuZXdSZWR1Y2VyO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdWJzY3JpYmUsXHJcbiAgICAgICAgZGlzcGF0Y2gsXHJcbiAgICAgICAgZ2V0U3RhdGUsXHJcbiAgICAgICAgcmVwbGFjZVJlZHVjZXIsXHJcbiAgICAgICAgdHJpZ2dlcixcclxuICAgICAgICByZW1vdmVcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVN0b3JlO1xyXG4iXSwibmFtZXMiOlsidGVzdCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBQUE7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtBQUNBLElBQWUsU0FBUyxPQUFPLENBQUMsR0FBRyxLQUFLLEVBQUU7SUFDMUM7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLElBQUksT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUQsQ0FBQzs7SUFFRDs7SUFFQTtJQUNBLFNBQVMsRUFBRSxDQUFDLElBQUksRUFBRTtJQUNsQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdCLElBQUksT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FB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
