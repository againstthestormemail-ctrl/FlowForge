import { supabase } from './supabase-client.js';

export function renderLoginForm(container) {
  container.innerHTML = `
    <div class="auth-card">
      <h1><span class="brand-flow">Flow</span><span class="brand-forge">Forge</span></h1>
      <p class="subtitle">Conveyor layout software for distributors</p>

      <form id="auth-form">
        <label for="auth-email">Email</label>
        <input type="email" id="auth-email" placeholder="you@company.com" required autocomplete="email">

        <div id="password-field">
          <label for="auth-password">Password</label>
          <input type="password" id="auth-password" placeholder="••••••••" minlength="6" autocomplete="current-password">
        </div>

        <button type="submit" class="btn-primary" id="auth-submit">Sign In</button>
        <button type="button" class="btn-secondary" id="auth-magic-link">Send Magic Link</button>
      </form>

      <div class="toggle-link">
        <span id="auth-toggle-text">Don't have an account?</span>
        <a id="auth-toggle">Sign Up</a>
      </div>

      <div class="error-msg" id="auth-error"></div>
      <div class="success-msg" id="auth-success"></div>
    </div>
  `;

  let isSignUp = false;
  const form = container.querySelector('#auth-form');
  const emailInput = container.querySelector('#auth-email');
  const passwordInput = container.querySelector('#auth-password');
  const submitBtn = container.querySelector('#auth-submit');
  const magicBtn = container.querySelector('#auth-magic-link');
  const toggleLink = container.querySelector('#auth-toggle');
  const toggleText = container.querySelector('#auth-toggle-text');
  const errorEl = container.querySelector('#auth-error');
  const successEl = container.querySelector('#auth-success');

  function clearMessages() {
    errorEl.textContent = '';
    successEl.textContent = '';
  }

  function showError(msg) {
    clearMessages();
    errorEl.textContent = msg;
  }

  function showSuccess(msg) {
    clearMessages();
    successEl.textContent = msg;
  }

  toggleLink.addEventListener('click', () => {
    isSignUp = !isSignUp;
    submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
    toggleLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
    passwordInput.autocomplete = isSignUp ? 'new-password' : 'current-password';
    clearMessages();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) return showError('Email is required.');
    if (!password || password.length < 6) return showError('Password must be at least 6 characters.');

    submitBtn.disabled = true;
    submitBtn.textContent = isSignUp ? 'Signing up…' : 'Signing in…';

    let result;
    if (isSignUp) {
      result = await supabase.auth.signUp({ email, password });
    } else {
      result = await supabase.auth.signInWithPassword({ email, password });
    }

    submitBtn.disabled = false;
    submitBtn.textContent = isSignUp ? 'Sign Up' : 'Sign In';

    if (result.error) {
      showError(result.error.message);
    } else if (isSignUp && !result.data.session) {
      showSuccess('Check your email for a confirmation link.');
    }
  });

  magicBtn.addEventListener('click', async () => {
    clearMessages();
    const email = emailInput.value.trim();
    if (!email) return showError('Enter your email first.');

    magicBtn.disabled = true;
    magicBtn.textContent = 'Sending…';

    const { error } = await supabase.auth.signInWithOtp({ email });

    magicBtn.disabled = false;
    magicBtn.textContent = 'Send Magic Link';

    if (error) {
      showError(error.message);
    } else {
      showSuccess('Magic link sent! Check your inbox.');
    }
  });
}
