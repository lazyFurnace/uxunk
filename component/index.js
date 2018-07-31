(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (factory());
}(this, (function () { 'use strict';

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

    compose(a1, b1, c1);

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
        return createStore => (...args) => {
            /**
             * 讲一下中间件的格式，中间件是一个柯里化的函数
             * ({ dispatch, getState }) => next => action => { ... }
             * 第一层接收一个对象，里面是 getState 和 dispatch 方法
             * 第二层接收 next 是下一个中间件的函数，如果是最后一个 next 就是 store 的 dispatch 方法(不是后面声明的那个)
             * 第三层就是触发 dispatch 的 action 和我们了解的 redux 一样
             */
            const store = createStore(...args);
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
            const chain = middlewares.map(middleware => middleware(middlewareAPI));
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
            };
        };
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

    const test = simulationCompose(...chain)(dispatch);

    test('applyMiddleware 测试');

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

    bindActionCreators(actionCreators, simulationDispatch);

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

    /**
     * react-uxunk
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
    function createStore(reducer, defaultState, enhancer) {
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
         * @param {*} newReducer
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



    var uxunk = /*#__PURE__*/Object.freeze({
        applyMiddleware: applyMiddleware,
        bindActionCreators: bindActionCreators,
        combineReducers: combineReducers,
        compose: compose,
        createStore: createStore
    });

    console.log(uxunk);

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb3NlLmpzIiwiLi4vc3JjL2FwcGx5TWlkZGxld2FyZS5qcyIsIi4uL3NyYy9iaW5kQWN0aW9uQ3JlYXRvcnMuanMiLCIuLi9zcmMvY29tYmluZVJlZHVjZXJzLmpzIiwiLi4vc3JjL2NyZWF0ZVN0b3JlLmpzIiwiLi4vc3JjL2luZGV4LmpzIiwiLi4vZXhhbXBsZS9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogY29tcG9zZSDlrp7njrBcclxuICog5Ye95pWw5L2c55So5piv5bCG5aSa5Liq5Ye95pWw6YCa6L+H5Ye95pWw5byP57yW56iL55qE5pa55byP57uE5ZCI6LW35p2lXHJcbiAqIOe7hOWQiOaIkOS4gOS4quWPr+S7pemTvuW8j+iwg+eUqOeahOWHveaVsOW5tui/lOWbnuWug1xyXG4gKiDmiafooYzov5Tlm57nmoTlh73mlbDlsIbku44gZnVuYyDnmoTmnIDlkI7kuIDkuKrlh73mlbDlvIDlp4vosIPnlKhcclxuICog5YCS5pWw56ys5LqM5Liq5Ye95pWw5Lul5pyA5ZCO5LiA5Liq5Ye95pWw55qE6L+U5Zue5YC85Li65Y+C5pWw5byA5aeL5omn6KGM77yM5Lul5q2k5p2l5o6oLi4uXHJcbiAqXHJcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmNzIOWwhuaJgOacieS8oOWFpeeahOWPguaVsOWQiOaIkOS4gOS4quaVsOe7hO+8jOavj+S4gOS4quWPguaVsOmDveaYr+S4gOS4qiBmdW5jdGlvblxyXG4gKlxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0g6L+U5Zue5LiA5Liq57uP6L+HIHJlZHVjZSDnu4TlkIjlkI7nmoTlh73mlbDvvIznsbvkvLzkuo4gYShiKGMoZCguLi5hcmcpKSkpXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb21wb3NlKC4uLmZ1bmNzKSB7XHJcbiAgICAvKipcclxuICAgICAqIOWwhiBmdW5jIOmAmui/hyByZWR1Y2Ug57uE5ZCI6LW35p2lXHJcbiAgICAgKiDkvovlpoIgZnVuYyA9IFthLCBiLCBjXVxyXG4gICAgICog56ys5LiA5qyh57uP6L+HIHJlZHVjZSDov5Tlm57nu5PmnpwgKC4uLmFyZykgPT4gYShiKC4uLmFyZykpXHJcbiAgICAgKiDnrKzkuozmrKHnu4/ov4cgcmVkdWNlIOi/lOWbnue7k+aenCAoLi4uYXJnKSA9PiAoKC4uLmFyZykgPT4gYShiKC4uLmFyZykpKShjKC4uLmFyZykpXHJcbiAgICAgKiDnrYnkuo4gKC4uLmFyZykgPT4gYShiKGMoLi4uYXJnKSkpXHJcbiAgICAgKiDlvZPmiJHku6zmiafooYzov5nkuKrnu5Pmnpzml7blhYjmiafooYwgYyDnhLblkI7ku6UgYyDnmoTnu5PmnpzmiafooYwgYi4uLlxyXG4gICAgICovXHJcbiAgICByZXR1cm4gZnVuY3MucmVkdWNlKChhLCBiKSA9PiAoLi4uYXJnKSA9PiBhKGIoLi4uYXJnKSkpO1xyXG59XHJcblxyXG4vLyAtLS0tIOaJvuacuuS8muWGmeS4quWNleWFg+a1i+ivlSAtLS0tXHJcblxyXG4vLyDmqKHmi5/kuInkuKrlh73mlbBcclxuZnVuY3Rpb24gYTEoZGF0YSkge1xyXG4gICAgY29uc29sZS5sb2coYGEgJHtkYXRhfWApO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbn1cclxuZnVuY3Rpb24gYjEoZGF0YSkge1xyXG4gICAgY29uc29sZS5sb2coYGIgJHtkYXRhfWApO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbn1cclxuZnVuY3Rpb24gYzEoZGF0YSkge1xyXG4gICAgY29uc29sZS5sb2coYGMgJHtkYXRhfWApO1xyXG4gICAgcmV0dXJuIGRhdGE7XHJcbn1cclxuXHJcbmNvbXBvc2UoYTEsIGIxLCBjMSk7XHJcbiIsImltcG9ydCBjb21wb3NlIGZyb20gJy4vY29tcG9zZSc7XHJcbi8qKlxyXG4gKiBhcHBseU1pZGRsZXdhcmUg5a6e546wXHJcbiAqIOWHveaVsOeahOS9nOeUqOaYr+WwhuS9oOWcqCByZWR1eCDkuK3nlKjliLDnmoTmiYDmnInkuK3pl7Tku7bnu4TlkIjotbfmnaVcclxuICog562J5b6F6Kem5Y+RIGRpc3BhdGNoIOaXtuS+neasoeinpuWPkeaJgOacieS4remXtOS7tlxyXG4gKiDmjqXmlLbkuIDkuKrlj4LmlbAgbWlkZGxld2FyZXMg5Lit6Ze05Lu25LusXHJcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IG1pZGRsZXdhcmVzIOaJgOacieS4remXtOS7tumDveaYr+WHveaVsFxyXG4gKlxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0g6L+U5Zue5LiA5Liq5Y+v5Lul5o6l5pS2IGNyZWF0ZVN0b3JlIOeahOWHveaVsFxyXG4gKiDlnKjkvb/nlKjov5nkuKrlh73mlbDnmoTmg4XlhrXkuIsgc3RvcmUg55qE5Yib5bu65bCG5Zyo6L+Z5Liq5Ye95pWw5Lit6L+b6KGMXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBhcHBseU1pZGRsZXdhcmUoLi4ubWlkZGxld2FyZXMpIHtcclxuICAgIC8qKlxyXG4gICAgICog6YWN5ZCIIGNyZWF0ZVN0b3JlIOS4reeahCBlbmhhbmNlciDmnaXlrp7njrDmnInkuK3pl7Tku7bnmoQgc3RvcmUg55qE5Yib5bu6XHJcbiAgICAgKiDmnInkuK3pl7Tku7bnmoQgc3RvcmUg5Lya5Zyo6Kem5Y+RIGRpc3BhdGNoIOWQju+8jOaJp+ihjCByZWR1Y2VyIOWJjeaJp+ihjOaJgOacieeahOS4remXtOS7tlxyXG4gICAgICogYXBwbHlNaWRkbGV3YXJlIOi/lOWbnueahOaYr+S4gOS4quafr+mHjOWMlueahOWHveaVsFxyXG4gICAgICog56ys5LiA5qyh5o6l5pS2IHJlZHV4IOeahCBjcmVhdGVTdG9yZVxyXG4gICAgICog56ys5LqM5qyh5o6l5pS25Yib5bu6IHN0b3JlIOaJgOmcgOimgeeahCByZWR1Y2VyIOWSjCBwcmVsb2FkZWRTdGF0ZVxyXG4gICAgICog5Lik5qyh5o6l5pS25ZCO5Yib5bu6IHN0b3JlXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBjcmVhdGVTdG9yZSA9PiAoLi4uYXJncykgPT4ge1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOiusuS4gOS4i+S4remXtOS7tueahOagvOW8j++8jOS4remXtOS7tuaYr+S4gOS4quafr+mHjOWMlueahOWHveaVsFxyXG4gICAgICAgICAqICh7IGRpc3BhdGNoLCBnZXRTdGF0ZSB9KSA9PiBuZXh0ID0+IGFjdGlvbiA9PiB7IC4uLiB9XHJcbiAgICAgICAgICog56ys5LiA5bGC5o6l5pS25LiA5Liq5a+56LGh77yM6YeM6Z2i5pivIGdldFN0YXRlIOWSjCBkaXNwYXRjaCDmlrnms5VcclxuICAgICAgICAgKiDnrKzkuozlsYLmjqXmlLYgbmV4dCDmmK/kuIvkuIDkuKrkuK3pl7Tku7bnmoTlh73mlbDvvIzlpoLmnpzmmK/mnIDlkI7kuIDkuKogbmV4dCDlsLHmmK8gc3RvcmUg55qEIGRpc3BhdGNoIOaWueazlSjkuI3mmK/lkI7pnaLlo7DmmI7nmoTpgqPkuKopXHJcbiAgICAgICAgICog56ys5LiJ5bGC5bCx5piv6Kem5Y+RIGRpc3BhdGNoIOeahCBhY3Rpb24g5ZKM5oiR5Lus5LqG6Kej55qEIHJlZHV4IOS4gOagt1xyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGNvbnN0IHN0b3JlID0gY3JlYXRlU3RvcmUoLi4uYXJncyk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5YaZ5LiA5Liq56m655qEIGRpc3BhdGNoIOWHveaVsO+8jOi/meS4qiBkaXNwYXRjaCDlsIbmmK/nlKjmnaXpk77lvI/op6blj5HkuK3pl7Tku7bnmoQgZGlzcGF0Y2gg5pa55rOVXHJcbiAgICAgICAgICog6L+Z5LiqIGRpc3BhdGNoIOS4jeaYr+ecn+atoyBzdG9yZSDkuIrnmoQgZGlzcGF0Y2jvvIzogIzmmK/op6blj5HmiYDmnInkuK3pl7Tku7bnmoQgZGlzcGF0Y2hcclxuICAgICAgICAgKiDlo7DmmI4gbWlkZGxld2FyZUFQSSDph4zpnaLmmK/miYDmnInkuK3pl7Tku7bpg73pnIDopoHnlKjliLDnmoQgZ2V0U3RhdGUg5ZKMIGRpc3BhdGNoIOaWueazlVxyXG4gICAgICAgICAqIOWcqOS4remXtOS7tuS4reiwg+eUqOi/memHjOeahCBkaXNwYXRjaCDmlrnms5XlsIbkvJrph43mlrDotbDkuIDpgY3miYDmnInkuK3pl7Tku7ZcclxuICAgICAgICAgKi9cclxuICAgICAgICBsZXQgZGlzcGF0Y2ggPSAoKSA9PiB7fTtcclxuXHJcbiAgICAgICAgY29uc3QgbWlkZGxld2FyZUFQSSA9IHtcclxuICAgICAgICAgICAgZ2V0U3RhdGU6IHN0b3JlLmdldFN0YXRlLFxyXG4gICAgICAgICAgICBkaXNwYXRjaDogKC4uLmFyZykgPT4gZGlzcGF0Y2goLi4uYXJnKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog6YGN5Y6G5Lyg5YWl55qE5omA5pyJ5Lit6Ze05Lu277yM5omn6KGM5omA5pyJ5Lit6Ze05Lu255qE56ys5LiA5bGC5Ye95pWw77yM5Lyg5YWlIGdldFN0YXRlIOWSjCBkaXNwYXRjaCDmlrnms5VcclxuICAgICAgICAgKi9cclxuICAgICAgICBjb25zdCBjaGFpbiA9IG1pZGRsZXdhcmVzLm1hcChtaWRkbGV3YXJlID0+IG1pZGRsZXdhcmUobWlkZGxld2FyZUFQSSkpO1xyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIOaIkeS7rOWwhui/memDqOWIhuaLhuW8gOadpeeci++8jOmmluWFiCBjb21wb3NlKC4uLmNoYWluKVxyXG4gICAgICAgICAqIOe7j+i/h+i/meS4gOatpeaIkeS7rOW+l+WIsOeahOaYryAoLi4uYXJnKSA9PiDkuK3pl7Tku7YxKOS4remXtOS7tjIo5Lit6Ze05Lu2MyguLi5hcmcpKSkg6L+Z5qC355qE5Ye95pWwXHJcbiAgICAgICAgICogY29tcG9zZSguLi5jaGFpbikoc3RvcmUuZGlzcGF0Y2gpXHJcbiAgICAgICAgICogYXJnID0gc3RvcmUuZGlzcGF0Y2gg5Lit6Ze05Lu2M+eahCBuZXh0IOWwseaYryBzdG9yZS5kaXNwYXRjaCDlh73mlbDvvIzkuK3pl7Tku7Yz6L+U5Zue55qE5Ye95pWwIGFjdGlvbiA9PiB7IC4uLiB9XHJcbiAgICAgICAgICog5Lit6Ze05Lu2MuaOpeaUtuS4remXtOS7tjPov5Tlm57nmoQgYWN0aW9uID0+IHsgLi4uIH0g5L2c5Li65Lit6Ze05Lu2MueahCBuZXh0IOeEtuWQjui/lOWbnuiHquW3seeahCBhY3Rpb24gPT4geyAuLi4gfVxyXG4gICAgICAgICAqIOacgOWQjui/lOWbnuS4remXtOS7tjHnmoQgYWN0aW9uID0+IHsgLi4uIH0g77yM5Lit6Ze05Lu2MeeahCBuZXh0IOaYr+S4remXtOS7tjLnmoQgYWN0aW9uID0+IHsgLi4uIH0gLOS+neasoeexu+aOqC4uLlxyXG4gICAgICAgICAqIOW9k+aIkeS7rOaJp+ihjOS4remXtOS7tjHnmoQgYWN0aW9uID0+IHsgLi4uIH0g5Lit6Kem5Y+R5Lit6Ze05Lu2MeeahCBuZXh0IOW8gOWni+aJp+ihjOS4remXtOS7tjLnmoQgYWN0aW9uID0+IHsgLi4uIH0gLOS+neasoeexu+aOqC4uLlxyXG4gICAgICAgICAqIOacgOWQjuaJp+ihjOS4remXtOS7tjPnmoQgbmV4dCDvvIzosIPnlKjkuoYgc3RvcmUuZGlzcGF0Y2gg5Ye95pWwXHJcbiAgICAgICAgICog55u45b2T5LqO6L+Z5LiqIGRpc3BhdGNoIOaYr+eUqOadpeinpuWPkeaJgOacieS4remXtOS7tueahO+8jOaJp+ihjOWujOaJgOacieS4remXtOS7tuWQju+8jOWwhuaJp+ihjOecn+ato+eahCBzdG9yZS5kaXNwYXRjaCDlh73mlbBcclxuICAgICAgICAgKi9cclxuICAgICAgICBkaXNwYXRjaCA9IGNvbXBvc2UoLi4uY2hhaW4pKHN0b3JlLmRpc3BhdGNoKTtcclxuXHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICog5bCGIHN0b3JlIOeahOWFtuS7luWHveaVsOS4jue7j+i/h+WwgeijheeahCBkaXNwYXRjaCDkuIDlkIzov5Tlm57vvIzlvaLmiJDmlrDnmoTlrozmlbTnmoQgc3RvcmVcclxuICAgICAgICAgKi9cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBkaXNwYXRjaCxcclxuICAgICAgICAgICAgLi4uc3RvcmVcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5cclxuLy8gLS0tLSDmib7mnLrkvJrlhpnkuKrljZXlhYPmtYvor5Uo5Zug5Li66L+Z5Liq5qih5Z2X6ZyA6KaB6YWN5ZCIIGNyZWF0ZVN0b3JlIOaJgOS7peWcqOi/memHjOWPquWNleeLrOWvueWKn+iDvee7j+ihjOa1i+ivlSkgLS0tLVxyXG5cclxuLy8g5qih5oufIGNvbXBvc2VcclxuZnVuY3Rpb24gc2ltdWxhdGlvbkNvbXBvc2UoLi4uZnVucykge1xyXG4gICAgcmV0dXJuIGZ1bnMucmVkdWNlKChhLCBiKSA9PiAoLi4uYXJnKSA9PiBhKGIoLi4uYXJnKSkpO1xyXG59XHJcblxyXG4vLyDkuInkuKrkuK3pl7Tku7ZcclxuZnVuY3Rpb24gdGh1bmsoKSB7XHJcbiAgICByZXR1cm4gKG5leHQpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygndGh1bmsg5aSW5bGC5Ye95pWw5omn6KGMJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2cobmV4dCk7XHJcblxyXG4gICAgICAgIHJldHVybiAoYWN0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfov5nmmK8gdGh1bmsg5Ye95pWwJyk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dChhY3Rpb24pO1xyXG4gICAgICAgIH07XHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIGxvZ2dlcigpIHtcclxuICAgIHJldHVybiAobmV4dCkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdsb2dnZXIg5aSW5bGC5Ye95pWw5omn6KGMJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2cobmV4dCk7XHJcblxyXG4gICAgICAgIHJldHVybiAoYWN0aW9uKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCfov5nmmK8gbG9nZ2VyIOWHveaVsCcpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG5leHQoYWN0aW9uKTtcclxuICAgICAgICB9O1xyXG4gICAgfTtcclxufVxyXG5mdW5jdGlvbiBidWdnZXIoKSB7XHJcbiAgICByZXR1cm4gKG5leHQpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnYnVnZ2VyIOWkluWxguWHveaVsOaJp+ihjCcpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKG5leHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gKGFjdGlvbikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygn6L+Z5pivIGJ1Z2dlciDlh73mlbAnKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0KGFjdGlvbik7XHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIOaooeaLnyBhcHBseU1pZGRsZXdhcmUg5omn6KGM6L+H56iLXHJcbmNvbnN0IG1pZGRsZXdhcmVzID0gW3RodW5rLCBsb2dnZXIsIGJ1Z2dlcl07XHJcbmNvbnN0IGNoYWluID0gbWlkZGxld2FyZXMubWFwKG1pZGRsZXdhcmUgPT4gbWlkZGxld2FyZSgpKTtcclxuXHJcbmNvbnN0IGRpc3BhdGNoID0gKGRhdGEpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgcmV0dXJuICfmiafooYzlrozmiJDov5Tlm54gYWN0aW9uJztcclxufTtcclxuXHJcbmNvbnN0IHRlc3QgPSBzaW11bGF0aW9uQ29tcG9zZSguLi5jaGFpbikoZGlzcGF0Y2gpO1xyXG5cclxudGVzdCgnYXBwbHlNaWRkbGV3YXJlIOa1i+ivlScpO1xyXG4iLCIvKipcclxuICogYmluZEFjdGlvbkNyZWF0b3JzIOWunueOsFxyXG4gKiDlh73mlbDnmoTkvZznlKjmmK/lsIbnlJ/miJAgYWN0aW9uIOeahOaWueazle+8jOS4jiBkaXNwYXRjaCDnu5PlkIjkvKDpgJLnu5nlrZDlhYPntKDnrYlcclxuICog5o6l5pS25Lik5Liq5Y+C5pWwIGFjdGlvbkNyZWF0b3JzIOWSjCBkaXNwYXRjaFxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYWN0aW9uQ3JlYXRvcnMg5piv5LiA5Liq5oiW5aSa5Liq55Sf5oiQIGFjdGlvbiDnmoTlh73mlbDnu4TmiJDnmoQgb2JqZWN0XHJcbiAqXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRpc3BhdGNoIOeUsSByZWR1eCDnmoQgY3JlYXRlU3RvcmUg55Sf5oiQ55qE6Kem5Y+R5Y+R5biDL+iuoumYheeahOaWueazlVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IOi/lOWbnuS4gOS4quW3sue7j+WcqOavj+S4gOS4qiBhY3Rpb25DcmVhdG9yIOS4iue7keWumuS6hiBkaXNwYXRjaCDmlrnms5XnmoTlr7nosaFcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJpbmRBY3Rpb25DcmVhdG9ycyhhY3Rpb25DcmVhdG9ycywgZGlzcGF0Y2gpIHtcclxuICAgIC8qKlxyXG4gICAgICog5Yib5bu6IGJvdW5kQWN0aW9uQ3JlYXRvcnMg5L2c5Li65bCG6KaB6L+U5Zue55qE5a+56LGhXHJcbiAgICAgKiDpgY3ljoYgYWN0aW9uQ3JlYXRvcnMg55qE5omA5pyJ5bGe5oCn77yM6I635Y+WIGFjdGlvbkNyZWF0b3JcclxuICAgICAqIOWGmeS4gOS4quaWueazleaJp+ihjO+8jOaOpeaUtumAmui/hyBhY3Rpb25DcmVhdG9yIOeUn+aIkCBhY3Rpb24g5omA6ZyA6KaB55qE5Y+C5pWwIGFyZ1xyXG4gICAgICogZGlzcGF0Y2gg5ZKMIGFjdGlvbkNyZWF0b3Ig55Sx5LqO6Zet5YyF5LiA55u05a2Y5ZyoXHJcbiAgICAgKiDosIPnlKggKC4uLmFyZykgPT4gZGlzcGF0Y2goYWN0aW9uQ3JlYXRvciguLi5hcmcpKSDml7ZcclxuICAgICAqIGFjdGlvbkNyZWF0b3IoLi4uYXJnKSDov5Tlm54gYWN0aW9uXHJcbiAgICAgKiBkaXNwYXRjaChhY3Rpb24pIOinpuWPkeWPkeW4gy/orqLpmIVcclxuICAgICAqL1xyXG4gICAgY29uc3QgYm91bmRBY3Rpb25DcmVhdG9ycyA9IHt9O1xyXG4gICAgT2JqZWN0LmtleXMoYWN0aW9uQ3JlYXRvcnMpLmZvckVhY2goKGl0ZW0pID0+IHtcclxuICAgICAgICBjb25zdCBhY3Rpb25DcmVhdG9yID0gYWN0aW9uQ3JlYXRvcnNbaXRlbV07XHJcbiAgICAgICAgYm91bmRBY3Rpb25DcmVhdG9yc1tpdGVtXSA9ICguLi5hcmcpID0+IGRpc3BhdGNoKGFjdGlvbkNyZWF0b3IoLi4uYXJnKSk7XHJcbiAgICB9KTtcclxuICAgIHJldHVybiBib3VuZEFjdGlvbkNyZWF0b3JzO1xyXG59XHJcblxyXG4vLyAtLS0tIOaJvuacuuS8muWGmeS4quWNleWFg+a1i+ivlSAtLS0tXHJcblxyXG4vLyDmqKHmi58gYWN0aW9uQ3JlYXRvclxyXG5mdW5jdGlvbiBhZGRUb2RvKHRleHQpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogJ0FERF9UT0RPJyxcclxuICAgICAgICB0ZXh0XHJcbiAgICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVUb2RvKGlkKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHR5cGU6ICdSRU1PVkVfVE9ETycsXHJcbiAgICAgICAgaWRcclxuICAgIH07XHJcbn1cclxuXHJcbi8vIOaooeaLnyBhY3Rpb25DcmVhdG9yc1xyXG5jb25zdCBhY3Rpb25DcmVhdG9ycyA9IHsgYWRkVG9kbywgcmVtb3ZlVG9kbyB9O1xyXG5cclxuLy8g5qih5oufIGRpc3BhdGNoXHJcbmZ1bmN0aW9uIHNpbXVsYXRpb25EaXNwYXRjaChhY3Rpb24pIHtcclxuICAgIGNvbnNvbGUubG9nKGFjdGlvbik7XHJcbiAgICBjb25zdCByZXN1bHQgPSBg5L2g6Kem5Y+R5LqGICR7YWN0aW9uLnR5cGV9IOeahCBhY3Rpb25gO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuYmluZEFjdGlvbkNyZWF0b3JzKGFjdGlvbkNyZWF0b3JzLCBzaW11bGF0aW9uRGlzcGF0Y2gpO1xyXG4iLCIvKipcclxuICogY29tYmluZVJlZHVjZXJzIOWunueOsFxyXG4gKiDlh73mlbDnmoTkvZznlKjmmK/lsIblpJrkuKogcmVkdWNlciDmjInnhacga2V5OiB2YWx1ZSDnu4TmiJDkuIDkuKrmm7TlpKfnmoQgcmVkdWNlclxyXG4gKiDmjqXmlLbkuIDkuKrlj4LmlbAgcmVkdWNlcnNcclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHJlZHVjZXJzIOaYr+WwhuWkmuS4qiByZWR1Y2VyIOe7hOWQiOaIkOeahOWvueixoVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0g6L+U5Zue55yf5q2j5pu/5LujIHJlZHVjZXIg55qE5Ye95pWwXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb21iaW5lUmVkdWNlcnMocmVkdWNlcnMgPSB7fSkge1xyXG4gICAgLyoqXHJcbiAgICAgKiBjb21iaW5lUmVkdWNlcnMg5Ye95pWw6L+U5Zue5LiA5LiqIGZ1bmN0aW9uXHJcbiAgICAgKiDov5nkuKrlh73mlbDmmK/nnJ/mraPnmoQgcmVkdWNlciDmjqXmlLbkuKTkuKrlj4LmlbBcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGUg6L+Z5Liq5piv5pW05L2T55qE6buY6K6k54q25oCBXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aW9uIOeUqOadpeinpuWPkSByZWR1Y2VyIOeahOWvueixoe+8jOW/heacieWtl+autSBhY3Rpb24udHlwZVxyXG4gICAgICpcclxuICAgICAqIEByZXR1cm4ge09iamVjdH0g6L+U5Zue5a6M5oiQ55qEIHN0YXRlXHJcbiAgICAgKi9cclxuICAgIHJldHVybiBmdW5jdGlvbiBjb21iaW5hdGlvbihzdGF0ZSA9IHt9LCBhY3Rpb24pIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiDpgY3ljoYgcmVkdWNlcnMg55qE5omA5pyJ5bGe5oCn77yM5Y+W5b6X5omA5pyJ55qEIHJlZHVjZXJcclxuICAgICAgICAgKiDkuLrmr4/kuKogcmVkdWNlciDkvKDlhaXlr7nlupTnmoQgc3RhdGUg5ZKMIOaJgOinpuWPkeeahCBhY3Rpb25cclxuICAgICAgICAgKiDlsIblr7nlupTov5Tlm57nmoQgc3RhdGUg5pS+5YWlIG5leHRTdGF0ZSDkuK1cclxuICAgICAgICAgKiDov5Tlm54gbmV4dFN0YXRlXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgY29uc3QgbmV4dFN0YXRlID0ge307XHJcbiAgICAgICAgT2JqZWN0LmtleXMocmVkdWNlcnMpLmZvckVhY2goKGtleSkgPT4ge1xyXG4gICAgICAgICAgICBuZXh0U3RhdGVba2V5XSA9IHJlZHVjZXJzW2tleV0oc3RhdGVba2V5XSwgYWN0aW9uKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbmV4dFN0YXRlO1xyXG4gICAgfTtcclxufVxyXG5cclxuLy8gLS0tLSDmib7mnLrkvJrlhpnkuKrljZXlhYPmtYvor5UgLS0tLVxyXG5cclxuLy8g5qih5oufIHN0YXRlXHJcbmxldCBzdGF0ZVNpbXVsYXRpb24gPSB7XHJcbiAgICBsb2dpblN0YXRlOiB7XHJcbiAgICAgICAgbG9naW46IGZhbHNlLFxyXG4gICAgICAgIG5hbWU6ICcnLFxyXG4gICAgICAgIGlkOiBudWxsXHJcbiAgICB9LFxyXG4gICAgaW5kZXhTdGF0ZToge1xyXG4gICAgICAgIHNob3BCb3k6IGZhbHNlLFxyXG4gICAgICAgIGdvb2RHaXJsOiBmYWxzZSxcclxuICAgICAgICB0ZXh0OiAnJ1xyXG4gICAgfVxyXG59O1xyXG5cclxuLy8g5qih5oufIGFjdGlvblR5cGVcclxuY29uc3QgbG9naW5BY3Rpb25UeXBlID0gJ0xPR0lOL0FDVElPTic7XHJcbmNvbnN0IGluZGV4QWN0aW9uVHlwZSA9ICdJTkRFWC9BQ1RJT04nO1xyXG5cclxuLy8g5qih5oufIGFjdGlvblxyXG5jb25zdCBsb2dpbkFjdGlvbiA9IHtcclxuICAgIHR5cGU6IGxvZ2luQWN0aW9uVHlwZSxcclxuICAgIG5hbWU6ICfmooXkuZDlh68nLFxyXG4gICAgaWQ6IDFcclxufTtcclxuY29uc3QgaW5kZXhBY3Rpb24gPSB7XHJcbiAgICB0eXBlOiBpbmRleEFjdGlvblR5cGUsXHJcbiAgICBpc1Blb3BsZTogdHJ1ZSxcclxuICAgIHRleHQ6ICfmhJrooKLnmoTkurrnsbvllYrvvIEnXHJcbn07XHJcblxyXG4vLyDmqKHmi58gcmVkdWNlclxyXG5mdW5jdGlvbiBsb2dpblJlZHVjZXIoc3RhdGUsIGFjdGlvbikge1xyXG4gICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xyXG4gICAgY2FzZSBsb2dpbkFjdGlvblR5cGU6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbG9naW46IHRydWUsXHJcbiAgICAgICAgICAgIG5hbWU6IGFjdGlvbi5uYW1lLFxyXG4gICAgICAgICAgICBpZDogYWN0aW9uLmlkXHJcbiAgICAgICAgfTtcclxuICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIHN0YXRlO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbmRleFJlZHVjZXIoc3RhdGUsIGFjdGlvbikge1xyXG4gICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xyXG4gICAgY2FzZSBpbmRleEFjdGlvblR5cGU6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc2hvcEJveTogYWN0aW9uLmlzUGVvcGxlLFxyXG4gICAgICAgICAgICBnb29kR2lybDogYWN0aW9uLmlzUGVvcGxlLFxyXG4gICAgICAgICAgICB0ZXh0OiBhY3Rpb24udGV4dFxyXG4gICAgICAgIH07XHJcbiAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBzdGF0ZTtcclxuICAgIH1cclxufVxyXG5cclxuLy8g57uE5ZCIIHJlZHVjZXJzXHJcbmNvbnN0IHRleHQgPSBjb21iaW5lUmVkdWNlcnMoe1xyXG4gICAgbG9naW5TdGF0ZTogbG9naW5SZWR1Y2VyLFxyXG4gICAgaW5kZXhTdGF0ZTogaW5kZXhSZWR1Y2VyXHJcbn0pO1xyXG5cclxuc3RhdGVTaW11bGF0aW9uID0gdGV4dChzdGF0ZVNpbXVsYXRpb24sIGxvZ2luQWN0aW9uKTtcclxuY29uc29sZS5sb2coc3RhdGVTaW11bGF0aW9uKTtcclxuXHJcbnN0YXRlU2ltdWxhdGlvbiA9IHRleHQoc3RhdGVTaW11bGF0aW9uLCBpbmRleEFjdGlvbik7XHJcbmNvbnNvbGUubG9nKHN0YXRlU2ltdWxhdGlvbik7XHJcbiIsIi8qKlxyXG4gKiByZWFjdC11eHVua1xyXG4gKiDmjInnhacgcmVkdXgg5rqQ56CB6L+b6KGM5Lu/5Yi2XHJcbiAqIOWPkeW4gy/orqLpmIXmqKHlvI9cclxuICog5oul5pyJIHJlZHV4IOeahOWHoOS5juaJgOacieWKn+iDvVxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSByZWR1Y2VyIOeUqOS6juWtmOaUvuaJgOacieeahOaVsOaNruWkhOeQhumAu+i+ke+8jOi/lOWbnuS4i+S4gOS4qnN0YXRl5qCRXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZWZhdWx0U3RhdGUg6buY6K6k55qE5Yid5aeL5YyWIHN0YXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGVuaGFuY2VyIOS4uiByZWR1eCDmj5DkvpvmiYDmnInkuK3pl7Tku7bvvIzlj6rog73kvb/nlKgnYXBwbHlNaWRkbGV3YXJlJ+aWueazleadpeeUn+aIkFxyXG4gKlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IOi/lOWbniBzdG9yZSDph4zpnaLljIXlkKsgcmVkdXgg5omA5pyJ5pWw5o2u5Y+K5pa55rOVXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVTdG9yZShyZWR1Y2VyLCBkZWZhdWx0U3RhdGUsIGVuaGFuY2VyKSB7XHJcbiAgICAvLyDliKTmlq3mmK/kuI3mmK/msqHmnIkgZGVmYXVsdFN0YXRlIOWPquaciSBlbmhhbmNlciDlpoLmnpzmmK/ov5nmoLflsLHkuqTmjaLkuIDkuItcclxuICAgIGlmICh0eXBlb2YgZW5oYW5jZXIgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkZWZhdWx0U3RhdGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBlbmhhbmNlciA9IGRlZmF1bHRTdGF0ZTtcclxuICAgICAgICBkZWZhdWx0U3RhdGUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcbiAgICAvLyDlpoLmnpzmnInkuK3pl7Tku7blsLHlnKjkuK3pl7Tku7bkuK3miafooYwgY3JlYXRlU3RvcmVcclxuICAgIGlmICh0eXBlb2YgZW5oYW5jZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gZW5oYW5jZXIoY3JlYXRlU3RvcmUpKHJlZHVjZXIsIGRlZmF1bHRTdGF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGN1cnJlbnRTdGF0ZSA9IGRlZmF1bHRTdGF0ZTtcclxuICAgIGxldCBjdXJyZW50UmVkdWNlciA9IHJlZHVjZXI7XHJcbiAgICBjb25zdCBjdXJyZW50TGlzdGVuZXJzID0gW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBkaXNwYXRjaCDlh73mlbDvvIzmiafooYwgcmVkdWNlciDvvIzop6blj5HmiYDmnIkgbGlzdGVuZXJcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gYWN0aW9uIOinpuWPkeWPkeW4gy/orqLpmIXnmoTkuovku7ZcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IOaJp+ihjOWQjui/lOWbniBhY3Rpb25cclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZGlzcGF0Y2goYWN0aW9uKSB7XHJcbiAgICAgICAgY3VycmVudFN0YXRlID0gY3VycmVudFJlZHVjZXIoY3VycmVudFN0YXRlLCBhY3Rpb24pO1xyXG4gICAgICAgIGN1cnJlbnRMaXN0ZW5lcnMuZm9yRWFjaChpdGVtID0+IGl0ZW0oKSk7XHJcbiAgICAgICAgcmV0dXJuIGFjdGlvbjtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdldFN0YXRlIOWHveaVsO+8jOi/lOWbnue7j+i/h+a3seWFi+mahueahCBzdGF0ZSDmoJFcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0U3RhdGUoKSB7XHJcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzdWJzY3JpYmUg5Ye95pWw77yM55So5LqO57uR5a6aIOinpuWPkSBkaXNwYXRjaCDmm7TmlrAgc3RhdGUg5pe26Kem5Y+R55qE5Ye95pWwXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4g5Lyg5YWl6ZyA6KaB5Yqg5YWlIGxpc3RlbmVycyDnu5HlrprnmoTlh73mlbBcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0g6Kej6Zmk5pS55Ye95pWw57uR5a6a55qE5pa55rOVXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHN1YnNjcmliZShmbikge1xyXG4gICAgICAgIC8vIOWmguaenCBmbiDmsqHmnInmiJbkuI3mmK/kuIDkuKogZnVuY3Rpb24g5oqb5Ye66ZSZ6K+vXHJcbiAgICAgICAgaWYgKCFmbiB8fCB0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc3Vic2NyaWJlZCEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gbGlzdGVuZXJzIOmHjOayoeaciei/meS4quaXtu+8jOWKoOi/m+WOu1xyXG4gICAgICAgIGlmIChjdXJyZW50TGlzdGVuZXJzLmluZGV4T2YoZm4pIDwgMCkge1xyXG4gICAgICAgICAgICBjdXJyZW50TGlzdGVuZXJzLnB1c2goZm4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyDov5Tlm57op6PpmaQgbGlzdGVuZXJzIOe7keWumueahOaWueazlVxyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiB1bnN1YnNjcmliZSgpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBjdXJyZW50TGlzdGVuZXJzLmluZGV4T2YoZm4pO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50TGlzdGVuZXJzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmVwbGFjZVJlZHVjZXIg5Ye95pWw77yM5o6l5pS25LiA5Liq5paw55qEIHJlZHVjZXIg5Luj5pu/5pen55qEXHJcbiAgICAgKiBAcGFyYW0geyp9IG5ld1JlZHVjZXJcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gcmVwbGFjZVJlZHVjZXIobmV3UmVkdWNlcikge1xyXG4gICAgICAgIGN1cnJlbnRSZWR1Y2VyID0gbmV3UmVkdWNlcjtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgc3Vic2NyaWJlLFxyXG4gICAgICAgIGRpc3BhdGNoLFxyXG4gICAgICAgIGdldFN0YXRlLFxyXG4gICAgICAgIHJlcGxhY2VSZWR1Y2VyXHJcbiAgICB9O1xyXG59XHJcbiIsImltcG9ydCBhcHBseU1pZGRsZXdhcmUgZnJvbSAnLi9hcHBseU1pZGRsZXdhcmUnO1xyXG5pbXBvcnQgYmluZEFjdGlvbkNyZWF0b3JzIGZyb20gJy4vYmluZEFjdGlvbkNyZWF0b3JzJztcclxuaW1wb3J0IGNvbWJpbmVSZWR1Y2VycyBmcm9tICcuL2NvbWJpbmVSZWR1Y2Vycyc7XHJcbmltcG9ydCBjb21wb3NlIGZyb20gJy4vY29tcG9zZSc7XHJcbmltcG9ydCBjcmVhdGVTdG9yZSBmcm9tICcuL2NyZWF0ZVN0b3JlJztcclxuXHJcblxyXG5leHBvcnQge1xyXG4gICAgYXBwbHlNaWRkbGV3YXJlLFxyXG4gICAgYmluZEFjdGlvbkNyZWF0b3JzLFxyXG4gICAgY29tYmluZVJlZHVjZXJzLFxyXG4gICAgY29tcG9zZSxcclxuICAgIGNyZWF0ZVN0b3JlXHJcbn07XHJcbiIsImltcG9ydCAqIGFzIHV4dW5rIGZyb20gJy4uL3Ny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
