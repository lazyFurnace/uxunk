/**
 * compose 实现
 * 函数作用是将多个函数通过函数式编程的方式组合起来
 * 组合成一个可以链式调用的函数并返回它
 * 执行返回的函数将从 func 的最后一个函数开始调用
 * 倒数第二个函数以最后一个函数的返回值为参数开始执行，以此来推...
 *
 * @param {...Function} funcs 将所有传入的参数合成一个数组，每一个参数都是一个 function
 *
 * @return {Function} 返回一个经过 reduce 组合后的函数，类似于 a(b(c(d(...arg))))
 */
export default function compose(...funcs) {
    /**
     * 将 func 通过 reduce 组合起来
     * 例如 func = [a, b, c]
     * 第一次经过 reduce 返回结果 (...arg) => a(b(...arg))
     * 第二次经过 reduce 返回结果 (...arg) => ((...arg) => a(b(...arg)))(c(...arg))
     * 等于 (...arg) => a(b(c(...arg)))
     * 当我们执行这个结果时先执行 c 然后以 c 的结果执行 b...
     */
    return funcs.reduce((a, b) => (...arg) => a(b(...arg)));
}
