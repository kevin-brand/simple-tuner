// Grab DOM-Elements
const hamburger = document.querySelector('#header .nav-list .hamburger');
const mobileMenu = document.querySelector('#header .nav-list ul');
const navElements = document.querySelectorAll('#header .nav-list ul a');
const header = document.querySelector('#header .header');
const themeToggle = document.querySelector("#theme-toggle");

let boxShadow;

// Perform setup once DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    boxShadow = window.getComputedStyle(header).getPropertyValue('--box-shadow');
});

themeToggle.addEventListener("click", () => {

    setTimeout(function() {
        boxShadow = window.getComputedStyle(header).getPropertyValue('--box-shadow');
        header.style.boxShadow = boxShadow;
    }, 100);

    
    document.body.classList.toggle('dark-theme-variables');
});

// Toggle active class to display the nav menu when someone clicks on the hamburger menu
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
});

// Toggle active class to display the nav menu when someone clicks on the navigation links
navElements.forEach(e => {
    console.log(e)
    e.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
});

document.addEventListener('scroll', () => {
    let scrollPos = window.scrollY;
    if (scrollPos > window.innerHeight - 10)
      header.style.boxShadow = boxShadow;
    else
      header.style.boxShadow = 'none';
});
