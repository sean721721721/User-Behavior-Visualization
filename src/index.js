import _ from 'lodash';
import './style.css';
import img from './11.jpg';
import Data from './data.xml';
import printMe from './print.js';

function component() {
    let element = document.createElement('div');
    let btn = document.createElement('button');

    // Lodash, now imported by this script
    element.innerHTML = _.join(['Hello', 'webpack'], ' ');
    element.classList.add('hello');

    btn.innerHTML = 'Click me and check the console!';
    btn.onclick = printMe;

    element.appendChild(btn);

    // Add the image to our existing div.
    let myIcon = new Image();
    myIcon.src = img;

    element.appendChild(myIcon);

    console.log(Data);

    return element;
}

document.body.appendChild(component());