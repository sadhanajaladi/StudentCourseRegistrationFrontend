define([], function () {
  return {
    render: function () {
      return '<main class="auth-page"><section class="auth-card"><h1>Student Portal</h1>' +
        '<p class="muted">Sign in to your account</p><div id="authNotice"></div>' +
        '<form id="loginForm"><label>Email Address</label><input name="email" type="email" required autocomplete="email" placeholder="Enter your email">' +
        '<label>Password</label><input name="password" type="password" required autocomplete="current-password" placeholder="Enter your password">' +
        '<button class="primary" type="submit">Login</button></form>' +
        '<p class="center">Don\'t have an account? <a href="#/register">Sign Up</a></p></section></main>';
    }
  };
});
