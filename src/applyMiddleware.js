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
    return (next) => action => {

        console.log('这是 thunk 函数');
    
        return next(action);
    };
}

function logger() {
    return (next) => (action) => {
		console.log(next)
        console.log('这是 logger 函数')

        return next(action)
    }
}
var middlewares = [thunk , logger];
var chain = middlewares.map(middleware => middleware());

var dispatch = (data) => {
    console.log(data)
    return data;
}

var admin = compose(...chain)(dispatch)

admin('wodetian')
