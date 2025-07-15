document.getElementById("signupForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  // 1. Phone validation: BD phone must start with 01 and be exactly 11 digits
  const phoneInput = this.phone.value.trim();
  const phonePattern = /^01\d{9}$/;
  if (!phonePattern.test(phoneInput)) {
    Swal.fire({
      icon: "error",
      title: "Invalid Phone Number",
      text: 'Phone number must start with "01" and be exactly 11 digits long (Bangladesh format).',
      confirmButtonText: "OK",
    });
    return;
  }

  // 2. Validate age >= 18
  const dobValue = this.dob.value;
  if (!dobValue) {
    Swal.fire({
      icon: "error",
      title: "Date of Birth Required",
      text: "Please select your date of birth.",
      confirmButtonText: "OK",
    });
    return;
  }
  const dob = new Date(dobValue);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 18) {
    Swal.fire({
      icon: "error",
      title: "Age Restriction",
      text: "You must be at least 18 years old to sign up.",
      confirmButtonText: "OK",
    });
    return;
  }

  // 3. Check if Terms and Privacy checkboxes are checked (last condition)
  const agreeTerms = document.getElementById("agreeTerms");
  const agreePrivacy = document.getElementById("agreePrivacy");

  if (!agreeTerms.checked && !agreePrivacy.checked) {
    Swal.fire({
      icon: "error",
      title: "Agreements Required",
      text: "You must agree to the Terms of Service and Privacy Policy to continue.",
      confirmButtonText: "OK",
    });
    return;
  }

  if (!agreeTerms.checked) {
    Swal.fire({
      icon: "error",
      title: "Terms of Service Required",
      text: "You must agree to the Terms of Service to continue.",
      confirmButtonText: "OK",
    });
    return;
  }

  if (!agreePrivacy.checked) {
    Swal.fire({
      icon: "error",
      title: "Privacy Policy Required",
      text: "You must agree to the Privacy Policy to continue.",
      confirmButtonText: "OK",
    });
    return;
  }

  // 4. All validation passed, submit the form
  const formData = new FormData(this);

  try {
    const response = await fetch("/signup", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: data.message,
        confirmButtonText: "OK",
      }).then(() => {
        this.reset();
        clearProfilePreview(); // Clear image preview after success
        window.location.href = "login.html"; // Redirect after OK
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "Signup failed",
        confirmButtonText: "OK",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Server Error",
      text: "An unexpected error occurred. Please try again later.",
      confirmButtonText: "OK",
    });
  }
});


// Friendly Flatpickr date picker config
flatpickr("#dob", {
  dateFormat: "Y-m-d",
  maxDate: "today",
  defaultDate: null,
  altInput: true,
  altFormat: "F j, Y",
  allowInput: true,
  placeholder: "Select your date of birth",
});

// Country to city mapping
const citiesByCountry = {
  Bangladesh: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet"],
  India: ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore"],
  Pakistan: ["Karachi", "Lahore", "Islamabad", "Rawalpindi"],
  "Sri Lanka": ["Colombo", "Kandy", "Galle"],
  Nepal: ["Kathmandu", "Pokhara", "Biratnagar"],
  USA: ["New York", "Los Angeles", "Chicago", "Houston", "San Francisco"],
  China: ["Beijing", "Shanghai", "Shenzhen", "Guangzhou"],
  Russia: ["Moscow", "Saint Petersburg", "Kazan"],
  "South Africa": ["Cape Town", "Johannesburg", "Durban"],
};

function populateCities() {
  const country = document.getElementById("country").value;
  const citySelect = document.getElementById("city");

  citySelect.innerHTML = `<option value="">-- Select City --</option>`;

  if (country && citiesByCountry[country]) {
    citiesByCountry[country].forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.text = city;
      citySelect.appendChild(option);
    });
  }
}

// Profile picture preview and clearing functions
function previewProfilePic(event) {
  const previewDiv = document.getElementById("profilePreview");
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewDiv.innerHTML = `<img src="${e.target.result}" alt="Profile Picture" class="w-full h-full object-cover rounded-full" />`;
    };
    reader.readAsDataURL(file);
  } else {
    previewDiv.innerHTML = '<span class="text-gray-400">No Image</span>';
  }
}

function clearProfilePreview() {
  const profileInput = document.getElementById("profilePic");
  const previewDiv = document.getElementById("profilePreview");
  profileInput.value = "";
  previewDiv.innerHTML = '<span class="text-gray-400">No Image</span>';
}

document.getElementById("profilePic").addEventListener("change", previewProfilePic);



//terms

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
  // Optionally prevent background scrolling when modal is open
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
  // Restore scroll
  document.body.style.overflow = '';
}

// Add extra validation for the checkboxes before submitting the form
document.getElementById("signupForm").addEventListener("submit", function (e) {
  const agreeTerms = document.getElementById("agreeTerms");
  const agreePrivacy = document.getElementById("agreePrivacy");

  if (!agreeTerms.checked || !agreePrivacy.checked) {
    e.preventDefault();
    Swal.fire({
      icon: "error",
      title: "Agreement Required",
      text: "You must agree to the Terms of Service and Privacy Policy to continue.",
      confirmButtonText: "OK",
    });
    return false;
  }
});

