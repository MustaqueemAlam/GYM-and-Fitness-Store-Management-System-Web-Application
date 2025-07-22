document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');

    if (logoutButton) { // Ensure the button exists before adding listener
        logoutButton.addEventListener('click', async function(event) {
            event.preventDefault(); // Prevent the default link behavior

            try {
                // Using a relative path for the logout endpoint
                // This assumes your frontend is served from the same origin (domain and port)
                // as your backend's API.
                const response = await fetch('/logout', {
                    method: 'POST', // Matches backend's app.post('/logout', ...)
                    credentials: 'include' // Essential for sending session cookies (e.g., connect.sid)
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Logout successful
                    Swal.fire({
                        icon: 'success',
                        title: 'Logged Out!',
                        text: data.message, // "Logged out successfully"
                        showConfirmButton: false,
                        timer: 1500 // Automatically close after 1.5 seconds
                    }).then(() => {
                        // Redirect to login page after SweetAlert closes
                        window.location.href = '../login.html'; // Adjust this to your actual login page
                    });
                } else {
                    // Logout failed (e.g., server error or success: false from backend)
                    Swal.fire({
                        icon: 'error',
                        title: 'Logout Failed',
                        text: data.message || 'An unexpected error occurred during logout.',
                    });
                    console.error('Logout failed:', data.message || response.statusText);
                }
            } catch (error) {
                // Network error
                Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Could not connect to the server. Please check your internet connection.',
                });
                console.error('Network error during logout:', error);
            }
        });
    } else {
        console.warn("Logout button with ID 'logoutButton' not found.");
    }
});