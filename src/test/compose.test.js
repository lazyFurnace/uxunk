import compose from '../compose';

// 模拟三个函数
function a1(data) {
    console.log(`a ${data}`);
    return data;
}
function b1(data) {
    console.log(`b ${data}`);
    return data;
}
function c1(data) {
    console.log(`c ${data}`);
    return data;
}

compose(a1, b1, c1);
