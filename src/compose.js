export default function compose(...funs) {
    return funs.reduce((a, b) => {
        return (...arg) => {
            return a(b(...arg))
        }
    })
}
function a(data) {
    console.log(data)
    return 'aaa';
}
function b(data) {
    console.log(data)
    return 'bbb';
}
function c(data) {
    console.log(data)
    return 'ccc';
}
var hahaha = compose(a, b, c);