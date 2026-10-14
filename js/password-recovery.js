/* MFDCO password recovery — supabase-js v2, existing window.supabaseClient */
(() => {
  'use strict';

  const client = window.supabaseClient;
  const page = document.body.dataset.mfdcoPasswordPage;
  const forgotForm = document.getElementById('mfdco-forgot-form');
  const resetForm = document.getElementById('mfdco-reset-form');

  function showMessage(element, message, kind = 'info') {
    if (!element) return;
    element.textContent = message;
    element.dataset.kind = kind;
    element.hidden = false;
  }

  function setPending(button, active, pendingText, normalText) {
    button.disabled = active;
    button.textContent = active ? pendingText : normalText;
  }

  if (!client || !client.auth) {
    const status = document.getElementById('mfdco-forgot-message') ||
                   document.getElementById('mfdco-reset-message');
    showMessage(status, '認証システムに接続できません。設定を確認してください。', 'error');
    if (forgotForm) forgotForm.hidden = true;
    if (resetForm) resetForm.hidden = true;
    return;
  }

  // 1) Reset email request. Do not disclose account existence.
  if (page === 'forgot' && forgotForm) {
    const button = document.getElementById('mfdco-send-reset');
    const status = document.getElementById('mfdco-forgot-message');
    const emailInput = document.getElementById('mfdco-forgot-email');

    forgotForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !emailInput.checkValidity()) {
        showMessage(status, '有効なメールアドレスを入力してください。', 'error');
        emailInput.focus();
        return;
      }

      setPending(button, true, '送信しています...', '再設定メールを送信');
      try {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password.html`
        });
        if (error) throw error;
        showMessage(status,
          '登録済みのメールアドレスの場合、再設定用メールが届きます。受信トレイと迷惑メールフォルダをご確認ください。',
          'success');
        // Prevent accidental duplicate submissions. Reload the page to retry.
        forgotForm.hidden = true;
      } catch (error) {
        console.error('MFDCO password reset request failed:', error?.name || 'unknown');
        showMessage(status,
          'メールの送信を受け付けられませんでした。しばらくしてから再試行してください。',
          'error');
      } finally {
        setPending(button, false, '送信しています...', '再設定メールを送信');
      }
    });
  }

  // 2) Permit password changes only after recovery-token authentication.
  if (page === 'reset' && resetForm) {
    const status = document.getElementById('mfdco-reset-message');
    const button = document.getElementById('mfdco-save-password');
    const passwordInput = document.getElementById('mfdco-reset-password');
    const confirmInput = document.getElementById('mfdco-reset-password-confirm');
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const hasRecoveryLink = hash.get('type') === 'recovery' || query.has('code');
    const linkError = hash.get('error_description') || query.get('error_description');

    let recoveryAuthorized = false;
    let finished = false;

    if (linkError) {
      showMessage(status, '認証リンクの有効期限が切れたか、無効です。再設定メールを送り直してください。', 'error');
    } else if (!hasRecoveryLink) {
      showMessage(status, 'パスワード再設定メール内のリンクから開いてください。', 'error');
    }

    function authorizeRecovery(session) {
      if (!session?.user || finished || linkError) return;
      recoveryAuthorized = true;
      resetForm.hidden = false;
      showMessage(status, 'メールリンクの認証が完了しました。新しいパスワードを設定してください。', 'success');
      // Avoid accidental leakage of recovery credentials in copied URLs/history.
      window.history.replaceState(null, '', window.location.pathname);
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (finished) return;
      if (event === 'PASSWORD_RECOVERY') {
        authorizeRecovery(session);
      } else if (event === 'SIGNED_IN' && query.has('code') && hasRecoveryLink) {
        // Some PKCE integrations finish with SIGNED_IN rather than PASSWORD_RECOVERY.
        authorizeRecovery(session);
      }
    });

    // Missing/expired links should never leave the UI in a loading state indefinitely.
    if (hasRecoveryLink && !linkError) {
      window.setTimeout(() => {
        if (!recoveryAuthorized && !finished) {
          showMessage(status,
            '認証を確認できませんでした。リンクの期限、またはSupabaseのURL設定を確認し、再設定メールを送り直してください。',
            'error');
        }
      }, 12000);
    }

    resetForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!recoveryAuthorized || finished) {
        showMessage(status, '先に再設定メール内のリンクで認証してください。', 'error');
        return;
      }
      const password = passwordInput.value;
      if (password.length < 8) {
        showMessage(status, '新しいパスワードは8文字以上にしてください。', 'error');
        return;
      }
      if (password !== confirmInput.value) {
        showMessage(status, '確認用パスワードが一致しません。', 'error');
        return;
      }
      setPending(button, true, '変更しています...', 'パスワードを変更');
      try {
        // Confirm with Auth server rather than trusting local UI or storage alone.
        const { data: userData, error: userError } = await client.auth.getUser();
        if (userError || !userData?.user) throw userError || new Error('No authenticated user');

        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;

        finished = true;
        recoveryAuthorized = false;
        resetForm.hidden = true;
        passwordInput.value = '';
        confirmInput.value = '';
        subscription.unsubscribe();

        // Sign out after a password reset to force fresh login.
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
          showMessage(status,
            'パスワードは変更されましたが、ログアウト処理が完了しませんでした。手動でログアウトしてください。',
            'error');
        } else {
          showMessage(status,
            'パスワードを変更しました。ログイン画面から新しいパスワードでログインしてください。',
            'success');
        }
      } catch (error) {
        console.error('MFDCO password update failed:', error?.name || 'unknown');
        showMessage(status,
          '変更できませんでした。認証リンクの期限またはパスワードの条件を確認し、必要に応じて再設定メールを送り直してください。',
          'error');
      } finally {
        setPending(button, false, '変更しています...', 'パスワードを変更');
      }
    });
  }
})();
