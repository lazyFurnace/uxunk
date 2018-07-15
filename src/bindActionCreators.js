export default function bindActionCreators(actionCreators, dispatch) {
    let boundActionCreators = {};
    Object.keys(actionCreators).forEach(item => {
        let actionCreator = actionCreators[item];
        boundActionCreators[item] =  (...arg) => dispatch(actionCreator(...arg))
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

