import bindActionCreators from '../bindActionCreators';

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
