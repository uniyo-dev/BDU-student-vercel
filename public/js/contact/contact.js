// Contact page logic

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const category = document.getElementById('category').value;
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !category || !subject || !message) {
      alert('Please fill in all required fields');
      return;
    }

    // Build mailto: link with pre-filled content
    const fullSubject = '[BD Buddy] [' + category + '] ' + subject;
    const fullBody =
      'Name: ' + name + '\n' +
      'Reply-to: ' + email + '\n' +
      'Category: ' + category + '\n' +
      '\n' +
      message;

    const mailto =
      'mailto:chalachewagegn7@gmail.com' +
      '?subject=' + encodeURIComponent(fullSubject) +
      '&body=' + encodeURIComponent(fullBody);

    // Open the user's email client
    window.location.href = mailto;

    // Show confirmation and reset
    const success = document.getElementById('successMsg');
    if (success) {
      success.classList.add('show');
      setTimeout(function () { success.classList.remove('show'); }, 6000);
    }
    form.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Reset button
  const resetBtn = document.getElementById('resetFormBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      form.reset();
    });
  }
});
