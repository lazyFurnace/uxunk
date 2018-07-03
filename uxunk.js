(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.uxunk = {})));
}(this, (function (exports) { 'use strict';

    function combineReducers(reducers = {}) {
        return function combination(state = {}, action) {
            return Object.keys(reducers).map(key => (
                reducers[key](state[key], action)
            ));
        };
    }

    // react-uxunk
    /*
     * uxunk 基于观察者模式、发布/订阅，参考的redux
     * uxunk 接收两个参数 reducer 和 defaultState
     * reducer 是处理以后所有数据关系的函数
     * defaultState 是默认的数据
     */
    function createStore(reducer, defaultState) {
        // state 中存放所有数据
        let state = defaultState;

        /*
         * eventQueue 存放所有发布\订阅的函数
         * eventQueue = {
         *  type: [fn, fn, fn, ...],
         *  ...
         * }
         */
        const eventQueue = {};

        /*
         * 用于处理传入的 type 和 action
         * type 为所触发订阅的类型 action 为修改数据所需要的参数，是一个对象 必须有type属性
         * dispatch 函数作用是将 当前数据、订阅类型、修改数据的 action 传入 reducer 中
         * reducer 返回修改后的所有数据 并触发当前订阅类型下发布给所有订阅的函数
         */
        function dispatch(type, action) {
            state = reducer(state, type, action);
            this.trigger(type);
        }

        // 获取当前所有数据
        function getState() {
            return JSON.parse(JSON.stringify(state));
        }

        // 绑定订阅类别、监听函数
        // 返回函数用于接触订阅
        function subscribe(name, fn) {
            if (!fn) return false;
            if (!eventQueue[name]) {
                eventQueue[name] = [fn];
            } else if (eventQueue[name] && !eventQueue[name].some(item => item === fn)) {
                eventQueue[name].push(fn);
            } else {
                throw Error('This function has been subscribed!');
            }
            return function unsubscribe() {
                if (!eventQueue[name]) return;

                const index = eventQueue[name].indexOf(fn);
                eventQueue[name].splice(index, 1);

                if (eventQueue[name].length === 0) {
                    delete eventQueue[name];
                }
            };
        }
        // 触发订阅类型的所有订阅了的函数
        function trigger(name, action) {
            if (eventQueue[name]) {
                eventQueue[name].forEach((item) => {
                    item(action);
                });
            } else {
                throw Error('No related subscriptions!');
            }
        }
        // 删除该订阅类型下的所有函数
        function remove(name) {
            if (eventQueue[name]) {
                delete eventQueue[name];
            } else {
                throw Error('No related subscriptions!');
            }
        }
        return {
            subscribe,
            dispatch,
            getState,
            trigger,
            remove
        };
    }

    exports.combineReducers = combineReducers;
    exports.createStore = createStore;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXh1bmsuanMiLCJzb3VyY2VzIjpbInNyYy9jb21iaW5lUmVkdWNlcnMuanMiLCJzcmMvY3JlYXRlU3RvcmUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gY29tYmluZVJlZHVjZXJzKHJlZHVjZXJzID0ge30pIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiBjb21iaW5hdGlvbihzdGF0ZSA9IHt9LCBhY3Rpb24pIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMocmVkdWNlcnMpLm1hcChrZXkgPT4gKFxyXG4gICAgICAgICAgICByZWR1Y2Vyc1trZXldKHN0YXRlW2tleV0sIGFjdGlvbilcclxuICAgICAgICApKTtcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNvbWJpbmVSZWR1Y2VycztcclxuIiwiLy8gcmVhY3QtdXh1bmtcclxuLypcclxuICogdXh1bmsg5Z+65LqO6KeC5a+f6ICF5qih5byP44CB5Y+R5biDL+iuoumYhe+8jOWPguiAg+eahHJlZHV4XHJcbiAqIHV4dW5rIOaOpeaUtuS4pOS4quWPguaVsCByZWR1Y2VyIOWSjCBkZWZhdWx0U3RhdGVcclxuICogcmVkdWNlciDmmK/lpITnkIbku6XlkI7miYDmnInmlbDmja7lhbPns7vnmoTlh73mlbBcclxuICogZGVmYXVsdFN0YXRlIOaYr+m7mOiupOeahOaVsOaNrlxyXG4gKi9cclxuZnVuY3Rpb24gY3JlYXRlU3RvcmUocmVkdWNlciwgZGVmYXVsdFN0YXRlKSB7XHJcbiAgICAvLyBzdGF0ZSDkuK3lrZjmlL7miYDmnInmlbDmja5cclxuICAgIGxldCBzdGF0ZSA9IGRlZmF1bHRTdGF0ZTtcclxuXHJcbiAgICAvKlxyXG4gICAgICogZXZlbnRRdWV1ZSDlrZjmlL7miYDmnInlj5HluINcXOiuoumYheeahOWHveaVsFxyXG4gICAgICogZXZlbnRRdWV1ZSA9IHtcclxuICAgICAqICB0eXBlOiBbZm4sIGZuLCBmbiwgLi4uXSxcclxuICAgICAqICAuLi5cclxuICAgICAqIH1cclxuICAgICAqL1xyXG4gICAgY29uc3QgZXZlbnRRdWV1ZSA9IHt9O1xyXG5cclxuICAgIC8qXHJcbiAgICAgKiDnlKjkuo7lpITnkIbkvKDlhaXnmoQgdHlwZSDlkowgYWN0aW9uXHJcbiAgICAgKiB0eXBlIOS4uuaJgOinpuWPkeiuoumYheeahOexu+WeiyBhY3Rpb24g5Li65L+u5pS55pWw5o2u5omA6ZyA6KaB55qE5Y+C5pWw77yM5piv5LiA5Liq5a+56LGhIOW/hemhu+aciXR5cGXlsZ7mgKdcclxuICAgICAqIGRpc3BhdGNoIOWHveaVsOS9nOeUqOaYr+WwhiDlvZPliY3mlbDmja7jgIHorqLpmIXnsbvlnovjgIHkv67mlLnmlbDmja7nmoQgYWN0aW9uIOS8oOWFpSByZWR1Y2VyIOS4rVxyXG4gICAgICogcmVkdWNlciDov5Tlm57kv67mlLnlkI7nmoTmiYDmnInmlbDmja4g5bm26Kem5Y+R5b2T5YmN6K6i6ZiF57G75Z6L5LiL5Y+R5biD57uZ5omA5pyJ6K6i6ZiF55qE5Ye95pWwXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRpc3BhdGNoKHR5cGUsIGFjdGlvbikge1xyXG4gICAgICAgIHN0YXRlID0gcmVkdWNlcihzdGF0ZSwgdHlwZSwgYWN0aW9uKTtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g6I635Y+W5b2T5YmN5omA5pyJ5pWw5o2uXHJcbiAgICBmdW5jdGlvbiBnZXRTdGF0ZSgpIHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShzdGF0ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIOe7keWumuiuoumYheexu+WIq+OAgeebkeWQrOWHveaVsFxyXG4gICAgLy8g6L+U5Zue5Ye95pWw55So5LqO5o6l6Kem6K6i6ZiFXHJcbiAgICBmdW5jdGlvbiBzdWJzY3JpYmUobmFtZSwgZm4pIHtcclxuICAgICAgICBpZiAoIWZuKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKCFldmVudFF1ZXVlW25hbWVdKSB7XHJcbiAgICAgICAgICAgIGV2ZW50UXVldWVbbmFtZV0gPSBbZm5dO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRRdWV1ZVtuYW1lXSAmJiAhZXZlbnRRdWV1ZVtuYW1lXS5zb21lKGl0ZW0gPT4gaXRlbSA9PT0gZm4pKSB7XHJcbiAgICAgICAgICAgIGV2ZW50UXVldWVbbmFtZV0ucHVzaChmbik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgRXJyb3IoJ1RoaXMgZnVuY3Rpb24gaGFzIGJlZW4gc3Vic2NyaWJlZCEnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHVuc3Vic2NyaWJlKCkge1xyXG4gICAgICAgICAgICBpZiAoIWV2ZW50UXVldWVbbmFtZV0pIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gZXZlbnRRdWV1ZVtuYW1lXS5pbmRleE9mKGZuKTtcclxuICAgICAgICAgICAgZXZlbnRRdWV1ZVtuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGV2ZW50UXVldWVbbmFtZV0ubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgZXZlbnRRdWV1ZVtuYW1lXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbiAgICAvLyDop6blj5HorqLpmIXnsbvlnovnmoTmiYDmnInorqLpmIXkuobnmoTlh73mlbBcclxuICAgIGZ1bmN0aW9uIHRyaWdnZXIobmFtZSwgYWN0aW9uKSB7XHJcbiAgICAgICAgaWYgKGV2ZW50UXVldWVbbmFtZV0pIHtcclxuICAgICAgICAgICAgZXZlbnRRdWV1ZVtuYW1lXS5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpdGVtKGFjdGlvbik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyByZWxhdGVkIHN1YnNjcmlwdGlvbnMhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8g5Yig6Zmk6K+l6K6i6ZiF57G75Z6L5LiL55qE5omA5pyJ5Ye95pWwXHJcbiAgICBmdW5jdGlvbiByZW1vdmUobmFtZSkge1xyXG4gICAgICAgIGlmIChldmVudFF1ZXVlW25hbWVdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBldmVudFF1ZXVlW25hbWVdO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IEVycm9yKCdObyByZWxhdGVkIHN1YnNjcmlwdGlvbnMhJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzdWJzY3JpYmUsXHJcbiAgICAgICAgZGlzcGF0Y2gsXHJcbiAgICAgICAgZ2V0U3RhdGUsXHJcbiAgICAgICAgdHJpZ2dlcixcclxuICAgICAgICByZW1vdmVcclxuICAgIH07XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVN0b3JlO1xyXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0lBQUEsU0FBUyxlQUFlLENBQUMsUUFBUSxHQUFHLEVBQUUsRUFBRTtJQUN4QyxJQUFJLE9BQU8sU0FBUyxXQUFXLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUU7SUFDcEQsUUFBUSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUc7SUFDNUMsWUFBWSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQztJQUM3QyxTQUFTLENBQUMsQ0FBQztJQUNYLEtBQUssQ0FBQztJQUNOLENBQUM7O0lDTkQ7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQSxTQUFTLFdBQVcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFO0lBQzVDO0lBQ0EsSUFB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
