// Dropdown functionality
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.nav-group > div[id$="Dropdown"]');
    const currentArrow = dropdown.previousElementSibling.querySelector('svg:last-child');

    // Close all other dropdowns
    allDropdowns.forEach(d => {
        if (d.id !== dropdownId && !d.classList.contains('hidden')) {
            d.classList.add('hidden');
            // Reset other arrows
            const arrow = d.previousElementSibling.querySelector('svg:last-child');
            arrow.style.transform = 'rotate(0deg)';
        }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('hidden');

    // Rotate arrow
    if (dropdown.classList.contains('hidden')) {
        currentArrow.style.transform = 'rotate(0deg)';
    } else {
        currentArrow.style.transform = 'rotate(180deg)';
    }
}