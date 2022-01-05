// Grab DOM-Elements
const hamburger = document.querySelector('header .nav-list .hamburger');
const mobileMenu = document.querySelector('header .nav-list ul');
const navElements = document.querySelectorAll('header .nav-list ul a');

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
