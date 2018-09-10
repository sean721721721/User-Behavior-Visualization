import _ from 'lodash';
import {
    cube
} from './math.js';
import './style.css';
import img from './11.jpg';
import Data from './data.xml';

if (process.env.NODE_ENV !== 'production') {
    console.log('Looks like we are in development mode!');
}

function component() {
    let element = document.createElement('div');

    // Lodash, now imported by this script
    let div = document.createElement('div');
    div.innerHTML = _.join(['Hello', 'webpack'], ' ');
    div.classList.add('hello');

    element.appendChild(div);

    let p = document.createElement('p');
    p.innerHTML = [
        '5 cubed is equal to ' + cube(5)
    ].join('\n\n');

    element.appendChild(p);


    let btn = document.createElement('button');
    btn.innerHTML = 'Click me and check the console!';
    // Note that because a network request is involved, some indication
    // of loading would need to be shown in a production-level site/app.
    btn.onclick = e =>
        import( /* webpackChunkName: "print" */ './print').then(module => {
            var print = module.default;

            print();
        });

    element.appendChild(btn);

    // Add the image to our existing div.
    let myIcon = new Image();
    myIcon.src = img;

    element.appendChild(myIcon);

    console.log(Data);

    return element;
}

let element = component();
document.body.appendChild(element);

if (module.hot) {
    module.hot.accept('./print.js', function () {
        console.log('Accepting the updated printMe module!');
        document.body.removeChild(element);
        element = component();
        document.body.appendChild(element);
    })
}