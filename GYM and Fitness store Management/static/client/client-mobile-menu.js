// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const sidebar = document.getElementById('sidebar');
    let isSidebarOpen = false;

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
        sidebar.classList.toggle('-translate-x-full');

        // Update the button icon
        const buttonIcon = mobileMenuButton.querySelector('svg');
        if (isSidebarOpen) {
            buttonIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            `;
        } else {
            buttonIcon.innerHTML = `
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
            `;
        }
    }

    // Toggle sidebar when menu button is clicked
    mobileMenuButton?.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function (e) {
        if (isSidebarOpen &&
            !sidebar?.contains(e.target) &&
            !mobileMenuButton?.contains(e.target)) {
            toggleSidebar();
        }
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 1024 && isSidebarOpen) { // 1024px is the 'lg' breakpoint
            isSidebarOpen = false;
            sidebar?.classList.remove('-translate-x-full');
        }
    });
});
