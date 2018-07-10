import combineReducers from './combineReducers';
import createStore from './createStore';

export {
    combineReducers,
    createStore
};



function bindActionCreators(actionCreators, dispatch) {
    let boundActionCreators = {};
    Object.keys(actionCreators).forEach(item => {
        let actionCreator = actionCreators[item];
        boundActionCreators[item] = (
            (actionCreator, dispatch) => (...arg) => dispatch(actionCreator(arg))
        )(actionCreator, dispatch)
    })
    return boundActionCreators;
}

function a(data) {
    return data;
}
function b(data) {
    return data;
}
function dispatch(data) {
    console.log(data);
}

var actionCreators = {a,b};

var admin = bindActionCreators(actionCreators, dispatch)

function compose(...funs) {
    let newFuns = funs.reduce((a, b) => {
        return (...arg) => {
            return a(b(...arg))
        }
    })
    console.log(newFuns);
}
function a(data) {
    return data;
}
function b(data) {
    return data;
}


