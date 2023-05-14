
var _hello = {};
var greeting = 'Hello World!';

_hello.sayHello = function(name) {
    console.log(greeting + ' ' + name);
}

if (typeof define === 'function'){
    define (function (){
        return _hello;
    });
}else if(typeof exports === 'object'){
    module.exports = _hello;
}else{
    window.hello = _hello;
};