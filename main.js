document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('getupto');
    const content = document.querySelector('.content'); // The first div
    const contentBack = document.querySelector('.content-back'); // The second div
    const roleSelect = document.getElementById('inputRole');
    const othersField = document.getElementById('othersField');
    const othersDescriptionInput = document.getElementById('inputothdescription');
    const loader = document.getElementById("form-loader");

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputs = form.querySelectorAll('input, select');
        let isValid = true;

        // Validate general form inputs
        inputs.forEach(input => {
            if ((input.type === 'text' || input.type === 'email') && !input.value.trim() && input.id !== 'inputothdescription') {
                input.classList.add('error-border');
                isValid = false;
            } else if (input.tagName.toLowerCase() === 'select' && input.value === 'Choose') {
                input.classList.add('error-border');
                isValid = false;
            } else {
                input.classList.remove('error-border');
            }
        });

        // Check the specific case for "Others" role and its description
        let role = roleSelect.value;
        if (roleSelect.value === 'Others') {
            if (!othersDescriptionInput.value.trim()) {
                othersDescriptionInput.classList.add('error-border');
                isValid = false;
            } else {
                role = othersDescriptionInput.value;
                othersDescriptionInput.classList.remove('error-border');
            }
        }

        // Prevent form submission if there are errors
        if (!isValid) {
            alert('Please fill in all required fields correctly.');
            return;
        }

        // Show the loader
        loader.style.display = 'flex';

        // Prepare the form data
        const formData = {
            name: document.getElementById('inputName').value,
            email: document.getElementById('inputEmail').value,
            role: role,
            featureSuggestion: document.getElementById('inputFeature').value,
            excited: document.getElementById('switch-id').checked,
            subscribe: document.getElementById('customCheck1').checked
        };

        // Send the form data to the server via a POST request
        fetch('https://uhtarticea.netlify.app/.netlify/functions/server', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Hide the loader
                loader.style.display = 'none';

                if (data.success) {
                    console.log(formData);
                    console.log('Form data saved successfully!');
                    // Reset the form
                    form.reset();
                    roleSelect.value = 'Choose';
                    othersField.style.display = 'none';

                    // Start the rotation and blur of the first div
                    content.classList.add('rotated');
                    contentBack.classList.add('rotating');

                    // Start rotating and showing the second div just before the first div finishes
                    setTimeout(() => {
                        contentBack.style.display = 'block';
                        setTimeout(() => {
                            contentBack.classList.add('show'); // Make the second div visible
                        }, 10); // Slight delay to trigger the transition properly
                    }, 1000); // Timing slightly before the rotation completes

                    // After 1 second, hide the first div
                    setTimeout(() => {
                        content.style.display = 'none';
                    }, 1000); // Timing to match the end of the first div's rotation
                } else {
                    console.error('Error saving form data:', data.error);
                    alert('Error saving form data. Please try again.');
                }
            })
            .catch(error => {
                // Hide the loader
                loader.style.display = 'none';

                console.error('Error:', error);
                alert('Error submitting form. Please try again.');
            });
    });

    // Remove error-border when user starts typing in text or email inputs
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('error-border');
            }
        });
    });

    // Remove error-border when user selects a different option
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value !== 'Choose') {
            roleSelect.classList.remove('error-border');
        }

        if (roleSelect.value === 'Others') {
            othersField.style.display = 'block';
        } else {
            othersField.style.display = 'none';
        }
    });

    // Remove error-border when user starts typing in the others description input
    othersDescriptionInput.addEventListener('input', () => {
        if (othersDescriptionInput.value.trim()) {
            othersDescriptionInput.classList.remove('error-border');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('getsubmit');
    const content = document.querySelector('.content'); // The first div
    const contentBack = document.querySelector('.content-back'); // The second div
    const roleSelect = document.getElementById('inputRole');
    const othersField = document.getElementById('othersField');
    const othersDescriptionInput = document.getElementById('inputothdescription');
    const workStudySelect = document.getElementById('workStudy');
    const loader = document.getElementById("form-loader");

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const inputs = form.querySelectorAll('input, select');
        let isValid = true;

        // Validate inputs
        inputs.forEach(input => {
            if ((input.type === 'text' || input.type === 'email' || input.type === 'number') && !input.value.trim() && input.id !== 'inputothdescription') {
                input.classList.add('error-border');
                isValid = false;
            } else if (input.tagName.toLowerCase() === 'select' && input.value === 'Choose') {
                input.classList.add('error-border');
                isValid = false;
            } else {
                input.classList.remove('error-border');
            }
        });

        let role = roleSelect.value;
        if (roleSelect.value === 'Others') {
            if (!othersDescriptionInput.value.trim()) {
                othersDescriptionInput.classList.add('error-border');
                isValid = false;
            } else {
                role = othersDescriptionInput.value;
                othersDescriptionInput.classList.remove('error-border');
            }
        }

        if (!isValid) {
            alert('Please fill in all required fields correctly.');
            return;
        }

        // Show the loader
        loader.style.display = 'flex';

        // ✅ Use FormData for file uploads
        const formData = new FormData();
        formData.append('name', document.getElementById('inputName').value);
        formData.append('email', document.getElementById('inputEmail').value);
        formData.append('phone', document.getElementById('inputPhone').value);
        formData.append('yop', document.getElementById('inputYop').value);
        formData.append('college', document.getElementById('inputCollege').value);
        formData.append('course', document.getElementById('inputCourse').value);
        formData.append('role', role);
        formData.append('workStudy', workStudySelect.value);

        // ✅ Append the actual file, not just its name
        if (document.getElementById('resumeUpload').files.length > 0) {
            formData.append('resume', document.getElementById('resumeUpload').files[0]);
        }

        // ✅ Correct fetch request (no manual Content-Type)
        fetch('https://articea-careers.netlify.app/.netlify/functions/server', {
            method: 'POST',
            body: formData, // Browser will set Content-Type correctly
        })
            .then(response => response.json())
            .then(data => {
                loader.style.display = 'none';

                if (data.success) {
                    console.log('Form submitted successfully:', formData);

                    form.reset();
                    roleSelect.value = 'Choose';
                    othersField.style.display = 'none';

                    content.classList.add('rotated');
                    contentBack.classList.add('rotating');

                    setTimeout(() => {
                        contentBack.style.display = 'block';
                        setTimeout(() => {
                            contentBack.classList.add('show');
                        }, 10);
                    }, 1000);

                    setTimeout(() => {
                        content.style.display = 'none';
                    }, 1000);
                } else {
                    console.error('Error saving form data:', data.error);
                    alert(`Error saving form data. Please try again.\nError: ${data.error}`);
                }                
            })
            .catch(error => {
                loader.style.display = 'none';
                console.error('Error:', error);
                alert('Error submitting form. Please try again.');
            });
    });

    // Remove error-border on input change
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('error-border');
            }
        });
    });

    roleSelect.addEventListener('change', () => {
        if (roleSelect.value !== 'Choose') {
            roleSelect.classList.remove('error-border');
        }
        othersField.style.display = roleSelect.value === 'Others' ? 'block' : 'none';
    });

    othersDescriptionInput.addEventListener('input', () => {
        if (othersDescriptionInput.value.trim()) {
            othersDescriptionInput.classList.remove('error-border');
        }
    });

    workStudySelect.addEventListener('change', () => {
        if (workStudySelect.value !== 'Choose') {
            workStudySelect.classList.remove('error-border');
        }
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    hamburger.addEventListener("click", function () {
        hamburger.classList.toggle("is-active");
    });
});

// Update label with selected file name
document.getElementById("resumeUpload").addEventListener("change", function () {
    let fileName = this.files[0] ? this.files[0].name : "Choose file";
    this.nextElementSibling.innerText = fileName;
});