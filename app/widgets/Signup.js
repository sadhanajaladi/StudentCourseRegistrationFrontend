define([], function () {
  return {
    render: function () {
      return '<main class="auth-page"><section class="auth-card"><h1>Create Student Account</h1>' +
        '<p class="muted">Register to explore courses and enroll.</p><div id="authNotice"></div>' +
        '<form id="registerForm"><label>Full Name</label><input name="name" required autocomplete="name" placeholder="Enter your full name">' +
        '<label>Email Address</label><input name="email" type="email" required autocomplete="email" placeholder="Enter your email">' +
        '<label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password">' +
        '<label>Confirm Password</label><input name="confirmPassword" type="password" minlength="8" required autocomplete="new-password">' +
        '<button class="primary" type="submit">Sign Up</button></form><p class="center">Already have an account? <a href="#/login">Login</a></p></section></main>';
    }
  };
});
