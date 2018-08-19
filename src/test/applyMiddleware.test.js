// ---- 因为这个模块需要配合 createStore 所以在这里只单独对功能经行测试 ----

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
