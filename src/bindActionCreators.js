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
export default function bindActionCreators(actionCreators, dispatch) {
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
