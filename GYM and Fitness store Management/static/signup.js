document.getElementById("signupForm").addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);

      try {
        const response = await fetch('/signup', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: data.message,
            confirmButtonText: 'OK',
          });
          this.reset();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || 'Signup failed',
            confirmButtonText: 'OK',
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: 'An unexpected error occurred. Please try again later.',
          confirmButtonText: 'OK',
        });
      }
    });
    
  flatpickr("#dob", {
    dateFormat: "Y-m-d",
    maxDate: "today",
    defaultDate: null,
  });
  const genderRadios = document.querySelectorAll('input[name="genderRadio"]');
  const genderInput = document.getElementById('gender');

  genderRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      genderInput.value = radio.value;
    });
 });