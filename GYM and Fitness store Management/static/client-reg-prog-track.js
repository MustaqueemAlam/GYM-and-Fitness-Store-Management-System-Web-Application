let currentClientId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // First, establish the session and get currentClientId
    await fetchSession();

    // If currentClientId is successfully set, then fetch other data
    if (currentClientId) {
        await fetchExercises(); // This doesn't depend on client ID
        await fetchProgressSnapshots(); // This now relies on the currentClientId set by fetchSession
        await fetchWorkoutLogs(); // This also relies on currentClientId
    }

    // Set current date for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('snapshotDate').value = today;
    document.getElementById('workoutDate').value = today;

    // Event Listeners
    // These event listeners will now trigger functions that use the `currentClientId`
    // from the enclosing scope.
    document.getElementById('addSnapshotBtn').addEventListener('click', addProgressSnapshot);
    document.getElementById('addWorkoutBtn').addEventListener('click', addWorkoutLog);

    document.getElementById('weightKg').addEventListener('input', calculateBMI);
});

async function fetchSession() {
    try {
        // Fetch the session using a relative path, assuming your frontend serves or proxies this.
        const response = await fetch('/api/user-session', { credentials: 'include' });

        if (!response.ok) {
            throw new Error('Not authenticated');
        }
        const data = await response.json();
        if (data.userType === 'client') {
            currentClientId = data.userId; // Set the module-level currentClientId
            console.log('Client ID:', currentClientId);
        } else {
            Swal.fire('Error', 'Only clients can access this page.', 'error').then(() => {
                window.location.href = 'login.html'; // Redirect to login
            });
        }
    } catch (error) {
        console.error('Session fetch error:', error);
        Swal.fire('Error', 'Please log in as a client to access this page.', 'error').then(() => {
            window.location.href = 'login.html'; // Redirect to login
        });
    }
}

function calculateBMI() {
    const weightKg = parseFloat(document.getElementById('weightKg').value);
    const heightMeters = 1.75; // Example height: 175 cm = 1.75 meters

    if (weightKg > 0 && heightMeters > 0) {
        const bmi = weightKg / (heightMeters * heightMeters);
        document.getElementById('bmi').value = bmi.toFixed(2);
    } else {
        document.getElementById('bmi').value = '';
    }
}

async function fetchExercises() {
    try {
        // Use relative path for API calls
        const response = await fetch('/api/exercises', { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const exercises = await response.json();
        const exerciseSelect = document.getElementById('exercise');
        exerciseSelect.innerHTML = '<option value="">Select Exercise</option>'; // Clear existing options
        exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise.ExerciseID;
            option.textContent = exercise.ExerciseName;
            exerciseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        Swal.fire('Error', 'Failed to load exercises.', 'error');
    }
}

async function addProgressSnapshot() {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Please refresh or log in.', 'error');
        return;
    }

    const dateTaken = document.getElementById('snapshotDate').value;
    const weightKg = parseFloat(document.getElementById('weightKg').value);
    const bodyFatPercent = parseFloat(document.getElementById('bodyFatPercent').value);
    const bmi = parseFloat(document.getElementById('bmi').value);
    const notes = document.getElementById('snapshotNotes').value;
    const progressImageFile = document.getElementById('progressImage').files[0];

    if (!dateTaken || isNaN(weightKg) || isNaN(bodyFatPercent) || isNaN(bmi)) {
        Swal.fire('Validation Error', 'Please fill in all required snapshot fields with valid numbers.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('dateTaken', dateTaken);
    formData.append('weightKg', weightKg);
    formData.append('bodyFatPercent', bodyFatPercent);
    formData.append('bmi', bmi);
    formData.append('notes', notes);
    if (progressImageFile) {
        formData.append('progressImage', progressImageFile);
    }

    try {
        // Use relative path for API calls, using currentClientId from the script's scope
        const response = await fetch(`/api/client/${currentClientId}/progress-snapshots`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            Swal.fire('Success', data.message, 'success');
            // Clear form fields
            document.getElementById('snapshotDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('weightKg').value = '';
            document.getElementById('bodyFatPercent').value = '';
            document.getElementById('bmi').value = '';
            document.getElementById('snapshotNotes').value = '';
            document.getElementById('progressImage').value = '';
            await fetchProgressSnapshots(); // Refresh the list
        } else {
            Swal.fire('Error', data.message || 'Failed to add progress snapshot.', 'error');
        }
    } catch (error) {
        console.error('Error adding progress snapshot:', error);
        Swal.fire('Error', 'Failed to connect to the server. Please try again later.', 'error');
    }
}

async function fetchProgressSnapshots() {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Cannot fetch snapshots.', 'error');
        return;
    }
    try {
        // Use relative path for API calls
        const response = await fetch(`/api/client/${currentClientId}/progress-snapshots`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const snapshots = await response.json();
        const tableBody = document.getElementById('progressSnapshotTableBody');
        tableBody.innerHTML = '';

        snapshots.forEach(snapshot => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = new Date(snapshot.DateTaken).toLocaleDateString();
            row.insertCell().textContent = snapshot.WeightKg;
            row.insertCell().textContent = snapshot.BodyFatPercent;
            row.insertCell().textContent = snapshot.BMI;
            row.insertCell().textContent = snapshot.Notes;

            const imageCell = row.insertCell();
            // Assumed that if SnapshotID exists, an image might exist, even if not directly returned in the list.
            if (snapshot.SnapshotID) {
                const viewImageBtn = document.createElement('button');
                viewImageBtn.textContent = 'View Image';
                viewImageBtn.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs';
                viewImageBtn.onclick = () => viewProgressImage(snapshot.SnapshotID); // Pass SnapshotID
                imageCell.appendChild(viewImageBtn);
            } else {
                imageCell.textContent = 'N/A';
            }
        });
    } catch (error) {
        console.error('Error fetching progress snapshots:', error);
        Swal.fire('Error', 'Failed to load progress snapshots.', 'error');
    }
}

async function viewProgressImage(snapshotId) {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Cannot view image.', 'error');
        return;
    }
    try {
        // Use relative path for API calls
        const response = await fetch(`/api/client/${currentClientId}/progress-snapshots/${snapshotId}/image`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);

        Swal.fire({
            title: 'Progress Image',
            imageUrl: imageUrl,
            imageAlt: 'Client Progress Image',
            imageWidth: 400,
            imageHeight: 300,
            confirmButtonText: 'Close',
            didClose: () => URL.revokeObjectURL(imageUrl)
        });

    } catch (error) {
        console.error('Error viewing progress image:', error);
        Swal.fire('Error', 'Failed to load image. It might be corrupted or missing.', 'error');
    }
}

async function addWorkoutLog() {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Please refresh or log in.', 'error');
        return;
    }

    const datePerformed = document.getElementById('workoutDate').value;
    const exerciseId = document.getElementById('exercise').value;
    const setsDone = parseInt(document.getElementById('sets').value);
    const repsDone = parseInt(document.getElementById('reps').value);
    const weightUsedKg = parseFloat(document.getElementById('weightUsed').value);
    const heartRate = parseInt(document.getElementById('heartRate').value) || null;
    const caloriesBurned = parseInt(document.getElementById('caloriesBurned').value) || null;
    const fatigueLevel = document.getElementById('fatigueLevel').value;
    const clientFeedback = document.getElementById('clientFeedback').value;
    const workoutAttachmentFile = document.getElementById('workoutAttachment').files[0];

    if (!datePerformed || !exerciseId || isNaN(setsDone) || isNaN(repsDone) || isNaN(weightUsedKg)) {
        Swal.fire('Validation Error', 'Please fill in all required workout log fields.', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('datePerformed', datePerformed);
    formData.append('exerciseId', exerciseId);
    formData.append('setsDone', setsDone);
    formData.append('repsDone', repsDone);
    formData.append('weightUsedKg', weightUsedKg);
    if (heartRate !== null) formData.append('heartRate', heartRate);
    if (caloriesBurned !== null) formData.append('caloriesBurned', caloriesBurned);
    formData.append('fatigueLevel', fatigueLevel);
    formData.append('clientFeedback', clientFeedback);
    if (workoutAttachmentFile) {
        formData.append('attachment', workoutAttachmentFile);
    }

    try {
        // Use relative path for API calls
        const response = await fetch(`/api/client/${currentClientId}/workouts`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            Swal.fire('Success', data.message, 'success');
            // Clear form fields
            document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('exercise').value = '';
            document.getElementById('sets').value = '';
            document.getElementById('reps').value = '';
            document.getElementById('weightUsed').value = '';
            document.getElementById('heartRate').value = '';
            document.getElementById('caloriesBurned').value = '';
            document.getElementById('fatigueLevel').value = 'Moderate';
            document.getElementById('clientFeedback').value = '';
            document.getElementById('workoutAttachment').value = '';
            await fetchWorkoutLogs(); // Refresh the list
        } else {
            Swal.fire('Error', data.message || 'Failed to add workout log.', 'error');
        }
    } catch (error) {
        console.error('Error adding workout log:', error);
        Swal.fire('Error', 'Failed to connect to the server. Please try again later.', 'error');
    }
}

async function fetchWorkoutLogs() {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Cannot fetch workout logs.', 'error');
        return;
    }
    try {
        // Use relative path for API calls
        const response = await fetch(`/api/client/${currentClientId}/workouts`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const workoutLogs = await response.json();
        const tableBody = document.getElementById('workoutLogTableBody');
        tableBody.innerHTML = '';

        workoutLogs.forEach(log => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = new Date(log.DatePerformed).toLocaleDateString();
            row.insertCell().textContent = log.ExerciseName;
            row.insertCell().textContent = log.SetsDone;
            row.insertCell().textContent = log.RepsDone;
            row.insertCell().textContent = log.WeightUsedKg;
            row.insertCell().textContent = log.HeartRate || 'N/A';
            row.insertCell().textContent = log.CaloriesBurned || 'N/A';
            row.insertCell().textContent = log.FatigueLevel;
            row.insertCell().textContent = log.ClientFeedback || 'N/A';
            row.insertCell().textContent = log.TrainerNotes || 'N/A';

            const attachmentCell = row.insertCell();
            if (log.WorkoutLogID) { // Assuming WorkoutLogID implies an attachment *could* be present.
                const viewAttachmentBtn = document.createElement('button');
                viewAttachmentBtn.textContent = 'View/Download';
                viewAttachmentBtn.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded text-xs';
                viewAttachmentBtn.onclick = () => viewWorkoutAttachment(log.WorkoutLogID); // Pass WorkoutLogID
                attachmentCell.appendChild(viewAttachmentBtn);
            } else {
                attachmentCell.textContent = 'N/A';
            }
        });
    } catch (error) {
        console.error('Error fetching workout logs:', error);
        Swal.fire('Error', 'Failed to load workout logs.', 'error');
    }
}

async function viewWorkoutAttachment(workoutLogId) {
    if (!currentClientId) {
        Swal.fire('Error', 'Client ID not available. Cannot view attachment.', 'error');
        return;
    }
    try {
        // Use relative path for API calls
        const response = await fetch(`/api/client/${currentClientId}/workouts/${workoutLogId}/attachment`, { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const attachmentBlob = await response.blob();
        const attachmentUrl = URL.createObjectURL(attachmentBlob);

        Swal.fire({
            title: 'Workout Attachment',
            html: `
                        <p>A file is available for download.</p>
                        <a href="${attachmentUrl}" download class="text-blue-600 underline">Click to Download Attachment</a>
                    `,
            icon: 'info',
            confirmButtonText: 'Close',
            didClose: () => URL.revokeObjectURL(attachmentUrl)
        });

    } catch (error) {
        console.error('Error viewing workout attachment:', error);
        Swal.fire('Error', 'Failed to load attachment. It might be corrupted or missing.', 'error');
    }
}