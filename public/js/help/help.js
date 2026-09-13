// Help page — FAQ logic

// Toggle FAQ open/closed
function toggleFAQ(element) {
  const faq = element.parentElement;
  faq.classList.toggle('open');
}

// Search filter
function filterFAQs() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const faqs = document.querySelectorAll('.faq');

  faqs.forEach(function (faq) {
    const text = faq.textContent.toLowerCase();
    if (text.includes(query)) {
      faq.style.display = '';
    } else {
      faq.style.display = 'none';
    }
  });
}

// Open first FAQ on load
document.addEventListener('DOMContentLoaded', function () {
  const firstFAQ = document.querySelector('.faq');
  if (firstFAQ) firstFAQ.classList.add('open');
});
