document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.username);
                    window.location.href = '/chat';
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match!');
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registration successful! Please login.');
                    window.location.href = '/login';
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token && window.location.pathname !== '/chat') {
        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/chat';
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
            }
        })
        .catch(error => {
            console.error('Token verification error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('username');
        });
    }
});
