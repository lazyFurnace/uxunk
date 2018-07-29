import compose from './compose';
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
export default function applyMiddleware(...middlewares) {
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
function compose(...funs) {
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

const test = compose(...chain)(dispatch);

test('applyMiddleware 测试');
