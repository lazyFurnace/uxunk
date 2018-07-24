function applyMiddleware(...middlewares) {
    return (createStore) => (...arg) => {
        const store = createStore(...arg);
        let dispatch = store.dispatch;
        const middlewareAPI = {
            getState: store.getState,
            dispatch: () => dispatch()
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
