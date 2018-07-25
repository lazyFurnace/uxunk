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
        const chain = middlewares.map((middleware) => middleware(middlewareAPI));
        
        dispatch = compose(...chain)(store.dispatch);

        return {
            dispatch,
            ...store
        }
    }
}


function compose(...funs) {
    return funs.reduce((a, b) => (...arg) => a(b(...arg)));
}

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

const middlewares = [thunk, logger, bugger];
const chain = middlewares.map(middleware => middleware());

const dispatch = (data) => {
    console.log(data);
    return '执行完成返回 action';
};

const admin = compose(...chain)(dispatch);

admin('wodetian');
