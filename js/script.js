let menu = document.querySelector('.uil-bars');
let header = document.querySelector('header');

menu.onclick = () => {
    menu.classList.toggle('uil-times-square');
    header.classList.toggle('active');

}

window.onscroll = () => {
    menu.classList.remove('uil-times-square');
    header.classList.remove('active');

}
//CURSOR

let cursor1 = document.querySelector('.cursor1');
let cursor2 = document.querySelector('.cursor2');

window.onmousemove = (e) => {
    cursor1.style.top = e.pageY + 'px';
    cursor1.style.left = e.pageX + 'px';
    cursor2.style.top = e.pageY + 'px';
    cursor2.style.left = e.pageX + 'px';

}

document.querySelectorAll('header').forEach(links => {
    links.onmouseenter = () => {
        cursor1.classList.add('active');
        cursor2.classList.add('active');
    }
    links.onmouseleave = () => {
        cursor1.classList.remove('active');
        cursor2.classList.remove('active');
    }
})

const open = document.getElementById('open');
const modal_container = document.getElementById('modal-container');
const close = document.getElementById('close');


open.addEventListener('click', () => {
    modal_container.classList.add('show')

})

close.addEventListener('click', () => {
    modal_container.classList.remove('show')
})