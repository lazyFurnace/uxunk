//actionType.js
const actionAddition = 'Addition';
const actionSubtraction = 'Subtraction';

//action.js
const forceHandling = (type, name) => ({type, name});

//reducer.js
const reducer = (state, type, action) => {
    console.log(type);
    switch(action.type) {
        case actionAddition:
            return state.map((item) => {
                if(item.name === action.name) {
                    item.troops += 1;
                }
                return item;
            })
        case actionSubtraction:
            return state.map((item) => {
                if(item.name === action.name) {
                    item.troops -= 1;
                }
                return item;
            })
        default:
            return state; 
            
    }
}

//原始数据
const defaultState = [
    {
        name: '帝国',
        troops: 0
    },{
        name: '矮人',
        troops: 0
    },{
        name: '高等精灵',
        troops: 0
    },{
        name: '兽人',
        troops: 0
    }
];

//绑定store
var store = uxunk(reducer, defaultState);

//修改所触发函数
const getData = () => {
    let store = window.store.getState();
    let troopsAll = 0;
    store.forEach((item, index) => {
        document.getElementsByClassName('troops-num')[index].innerHTML = item.troops;
        troopsAll += item.troops;
    })
    document.getElementsByClassName('troops-all')[0].innerHTML = troopsAll;
}

//监听 getData 函数
store.listen('changeTroops', getData);

//elem
const root = document.getElementById('root');

//根据原始数据初次渲染页面
(function render(state) {
    let flag = document.createDocumentFragment();
    let ul = document.createElement('ul');

    state.forEach((item) => {
        let li = document.createElement('li');

        let b = document.createElement('b');
        b.innerHTML = item.name + '：';

        let p = document.createElement('p');

        let add = document.createElement('button');
        add.innerHTML = '+';
        add.dataset.key = actionAddition;
        add.dataset.index = item.name;

        let sub = document.createElement('button');
        sub.innerHTML = '-';
        sub.dataset.key = actionSubtraction;
        sub.dataset.index = item.name;

        let span = document.createElement('span');
        span.className = 'troops-num';
        span.innerHTML = item.troops;

        p.appendChild(add);
        p.appendChild(span);
        p.appendChild(sub);

        li.appendChild(b);
        li.appendChild(p);


        ul.appendChild(li);
    })
    
    let div = document.createElement('div');
    div.innerHTML = `<b>一共：</b><span class="troops-all">0</span>`;

    flag.appendChild(ul);
    flag.appendChild(div);

    root.appendChild(flag);
})(defaultState)

//绑定监听事件
root.addEventListener('click', (e) => {
    if(e.target.nodeName !== 'BUTTON') {
        return;
    }
    let target = e.target;
    store.dispatch('changeTroops', forceHandling(target.dataset.key, target.dataset.index));
})
