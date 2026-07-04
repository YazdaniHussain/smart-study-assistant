// ── Auth Guard ────────────────────────────────────────
const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user') || '{}');
if (!token) window.location.href = '/pages/index.html';

// ── Set User Info ─────────────────────────────────────
document.getElementById('navUsername').textContent = user.username || 'Student';
document.getElementById('navAvatar').textContent   = (user.username || 'S')[0].toUpperCase();

// ── Welcome Message by Time ───────────────────────────
const hour     = new Date().getHours();
const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
document.getElementById('welcomeText').textContent = `${greeting}, ${user.username}! 👋`;

// ── Motivational Quotes ───────────────────────────────
const quotes = [
  { text: "The secret of getting ahead is getting started.",                           author: "— Mark Twain" },
  { text: "It always seems impossible until it's done.",                               author: "— Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.",                       author: "— Sam Levenson" },
  { text: "Success is the sum of small efforts repeated day in and day out.",          author: "— Robert Collier" },
  { text: "The expert in anything was once a beginner.",                               author: "— Helen Hayes" },
  { text: "Believe you can and you're halfway there.",                                 author: "— Theodore Roosevelt" },
  { text: "Your limitation — it's only your imagination.",                             author: "— Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.",             author: "— Unknown" },
  { text: "Great things never come from comfort zones.",                               author: "— Unknown" },
  { text: "Dream it. Wish it. Do it.",                                                 author: "— Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "— Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.",                     author: "— Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.",                 author: "— Unknown" },
  { text: "Little by little, a little becomes a lot.",                                author: "— Tanzanian Proverb" },
  { text: "You don't have to be great to start, but you have to start to be great.",  author: "— Zig Ziglar" },
  { text: "An investment in knowledge pays the best interest.",                        author: "— Benjamin Franklin" },
  { text: "The beautiful thing about learning is that nobody can take it away from you.", author: "— B.B. King" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.",      author: "— Jim Ryun" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "— A.A. Milne" },
  { text: "The only way to do great work is to love what you do.",                    author: "— Steve Jobs" },
  { text: "Study hard what interests you the most in the most undisciplined way.",    author: "— Richard Feynman" },
  { text: "Education is the most powerful weapon you can use to change the world.",   author: "— Nelson Mandela" },
];

let currentQuote = 0;
const quoteText   = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const quoteDots   = document.getElementById('quoteDots');

// Build dots
quotes.forEach((_, i) => {
  const dot = document.createElement('div');
  dot.className = `quote-dot ${i === 0 ? 'active' : ''}`;
  dot.addEventListener('click', () => goToQuote(i));
  quoteDots.appendChild(dot);
});

function goToQuote(index) {
  quoteText.style.opacity   = '0';
  quoteText.style.transform = 'translateY(10px)';
  quoteAuthor.style.opacity = '0';

  setTimeout(() => {
    currentQuote            = index;
    quoteText.textContent   = `"${quotes[index].text}"`;
    quoteAuthor.textContent = quotes[index].author;
    quoteText.style.opacity   = '1';
    quoteText.style.transform = 'translateY(0)';
    quoteAuthor.style.opacity = '1';

    document.querySelectorAll('.quote-dot').forEach((d, i) => {
      d.classList.toggle('active', i === index);
    });
  }, 400);
}

goToQuote(0);
setInterval(() => {
  const next = (currentQuote + 1) % quotes.length;
  goToQuote(next);
}, 6000);