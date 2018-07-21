function applyMiddleware(...middle) {
  
}


function compose(...funs) {
    return funs.reduce((a, b) => {
        return (...arg) => {
            return a(b(...arg))
        }
    })
}
  
function thunk() {
    return (next) => {

        console.log('thunk 外层函数执行')
        console.log(next);

        return (action) => {

            console.log('这是 thunk 函数');
        
            return next(action);
        };
    }
}

function logger() {
    return (next) => {

        console.log('logger 外层函数执行')
        console.log(next);

        return (action) => {
        
            console.log('这是 logger 函数')

            return next(action)
        }
    }
}

function bugger() {
    return (next) => {

        console.log('bugger 外层函数执行')
        console.log(next);

        return (action) => {
        
            console.log('这是 bugger 函数')

            return next(action)
        }
    }
}

var middlewares = [thunk , logger, bugger];
var chain = middlewares.map(middleware => middleware());

var dispatch = (data) => {
    console.log(data)
    return '执行完成返回 action'
}

var admin = compose(...chain)(dispatch)

admin('wodetian')
