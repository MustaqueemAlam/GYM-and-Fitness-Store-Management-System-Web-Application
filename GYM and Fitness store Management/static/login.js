document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const userType = document.getElementById("userType").value;

    if (!email || !password || !userType) {
      alert("Please fill all fields.");
      return;
    }

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password, userType }),
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          title: 'Logging you in...',
          html: 'Please wait a moment',
          timer: 3000,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
          },
         willClose: () => {
            sessionStorage.setItem('userType', data.userType);
            sessionStorage.setItem('name', data.message.replace('Welcome back, ', '').replace('!', ''));

            if (data.userType === 'admin') {
              sessionStorage.setItem('adminId', data.adminId);
              window.location.href = 'admin-dashboard.html';
            } else if (data.userType === 'trainer') {
              sessionStorage.setItem('trainerId', data.trainerId);
              window.location.href = 'trainer-dashboard.html';
            } else {
              sessionStorage.setItem('clientId', data.clientId);
              window.location.href = 'client-dashboard.html';
            }
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Login failed',
          text: data.message,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Network error',
        text: 'Please try again later.',
      });
      console.error(error);
    }
});