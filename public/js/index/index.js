// Index page — login page logic

// Toggle "What's New" collapsible
function toggleWhatsNew() {
  const box = document.getElementById('whatsNewBox');
  if (box) box.classList.toggle('open');
}

// About modal
function openAboutModal() {
  const modal = document.getElementById('aboutModal');
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeAboutModal() {
  const modal = document.getElementById('aboutModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

function closeAboutModalOutside(event) {
  if (event.target.id === 'aboutModal') closeAboutModal();
}

// Close on Escape
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeAboutModal();
});
