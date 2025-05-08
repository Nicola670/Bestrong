document.addEventListener('DOMContentLoaded', function() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const errorMessageElement = document.getElementById('error-message');

    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = document.getElementById('new_password').value;
        const confirmPassword = document.getElementById('confirm_password').value;
        
        if (newPassword !== confirmPassword) {
            alert('Le password non corrispondono');
            return;
        }

        try {
            const response = await fetch(changePasswordForm.dataset.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                window.location.href = data.redirect;
            } else {
                alert(data.error || 'Errore durante il cambio password');
            }
        } catch (error) {
            console.error('Errore:', error);
            alert('Si è verificato un errore durante il cambio password');
        }
    });
});