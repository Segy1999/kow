This is a significant architectural shift. Moving from a React SPA (Single Page Application) to Astro with "plain HTML, CSS, and JS" implies moving away from client-side state management (React Hooks, Context) to **Server-Side Rendering (SSR)** for initial loads and **Vanilla JavaScript** for interactivity.

This approach will make your site significantly faster, better for SEO, and lighter to load.

Here is the comprehensive guide and code structure to rewrite Kow Tattys in Astro.

### Phase 1: Project Setup

1.  **Initialize Astro:**
    ```bash
    npm create astro@latest kowtattys-astro
    # Select "Empty" template
    # Select "Yes" for TypeScript (recommended, even for plain JS logic)
    ```

2.  **Install Dependencies:**
    You need Tailwind and Supabase.
    ```bash
    npx astro add tailwind
    npm install @supabase/supabase-js
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root.
    ```env
    PUBLIC_SUPABASE_URL=your_supabase_url
    PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### Phase 2: Global Structure & Layout

In Astro, we replace `App.tsx` and `index.html` with a Layout component. We will replace Shadcn React components with standard HTML styled with Tailwind.

**`src/layouts/Layout.astro`**
(Handles HTML structure, SEO, Theme, and Navbar/Footer)

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = "Toronto's premiere tattoo experience" } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content={description} />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    <!-- Prevent Flash of Incorrect Theme -->
    <script is:inline>
      const theme = (() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
          return localStorage.getItem('theme');
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      })();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    </script>
  </head>
  <body class="bg-background text-foreground font-playfair min-h-screen flex flex-col">
    <header class="fixed w-full z-50 bg-background/80 backdrop-blur-sm border-b">
      <div class="container mx-auto px-4 h-16 flex justify-between items-center">
        <a href="/" class="font-doto text-4xl font-bold">KowTattys</a>
        
        <nav class="hidden md:flex items-center space-x-8">
          <a href="/" class="hover:text-primary transition-colors">Home</a>
          <a href="/portfolio" class="hover:text-primary transition-colors">Portfolio</a>
          <a href="/flash-designs" class="hover:text-primary transition-colors">Flash</a>
          <a href="/booking" class="hover:text-primary transition-colors">Book Now</a>
          <a href="/contact" class="hover:text-primary transition-colors">Contact</a>
          
          <button id="theme-toggle" class="p-2 hover:bg-accent rounded-full">
            <!-- Icons handled by CSS/JS below -->
            <span class="dark:hidden">🌙</span>
            <span class="hidden dark:inline">☀️</span>
          </button>
        </nav>
        
        <!-- Mobile Menu Button would go here -->
      </div>
    </header>

    <main class="flex-grow pt-16">
      <slot />
    </main>

    <footer class="bg-background border-t py-8 mt-20">
      <div class="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Kow Tattys. All rights reserved.</p>
      </div>
    </footer>

    <script>
      // Vanilla JS for Theme Toggle
      const handleToggleClick = () => {
        const element = document.documentElement;
        element.classList.toggle("dark");
        const isDark = element.classList.contains("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      };
      document.getElementById("theme-toggle")?.addEventListener("click", handleToggleClick);
    </script>
  </body>
</html>
```

**`src/styles/global.css`**
(Copy the contents of your original `src/index.css` here, keeping the Tailwind directives).

### Phase 3: Home Page & Interactivity

We replace the React `Particles` component with a Vanilla JS Canvas implementation inside a `<script>` tag.

**`src/pages/index.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { supabase } from '../lib/supabase';

// Server-Side Data Fetching for Featured Work
// This runs at build time (SSG) or request time (SSR)
const { data: featuredWorks } = await supabase
  .from('portfolio')
  .select('*')
  .eq('featured', true)
  .order('created_at', { ascending: false });
---

<Layout title="Kow Tattys | Home">
  <!-- Hero Section -->
  <section class="relative h-screen flex items-center justify-center bg-black text-white overflow-hidden">
    <canvas id="particles-canvas" class="absolute inset-0 w-full h-full"></canvas>
    
    <div class="relative z-20 text-center px-4">
      <h1 class="text-5xl md:text-7xl font-bold font-doto mb-6 typing-effect">
        KowTattys
      </h1>
      <p class="text-xl mb-8">Where Art Meets Skin</p>
      <a href="/booking" class="bg-primary text-primary-foreground px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity">
        Book Now
      </a>
    </div>
  </section>

  <!-- Featured Work -->
  <section class="py-20 bg-background">
    <div class="container mx-auto px-4">
      <h2 class="text-4xl font-bold text-center mb-12 font-doto">Featured Artworks</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {featuredWorks && featuredWorks.map((work) => (
          <div class="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
            <img 
              src={work.image_url} 
              alt={work.title}
              class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span class="text-white text-lg font-bold">{work.title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
</Layout>

<script>
  // Vanilla JS Particle Animation
  const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  
  let particlesArray: any[] = [];
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;

    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2;
      this.speedX = (Math.random() * 1) - 0.5;
      this.speedY = (Math.random() * 1) - 0.5;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.size > 0.2) this.size -= 0.1;
    }

    draw() {
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handleParticles() {
    for (let i = 0; i < 50; i++) {
        particlesArray.push(new Particle());
    }
  }
  
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Simple placeholder logic for brevity - insert full particle logic here
    requestAnimationFrame(animate);
  }
  
  animate();
</script>

<style>
  /* CSS Typewriter substitute */
  .typing-effect {
    overflow: hidden;
    border-right: .15em solid orange;
    white-space: nowrap;
    animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
  }

  @keyframes typing {
    from { width: 0 }
    to { width: 100% }
  }

  @keyframes blink-caret {
    from, to { border-color: transparent }
    50% { border-color: orange; }
  }
</style>
```

### Phase 4: Portfolio Page (Native Dialogs)

We use the native HTML `<dialog>` element for the modal view, eliminating the need for Radix UI.

**`src/pages/portfolio.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
import { supabase } from '../lib/supabase';

const { data: portfolioItems } = await supabase
  .from('portfolio')
  .select('*')
  .order('created_at', { ascending: false });
---

<Layout title="Portfolio">
  <div class="container mx-auto px-4 py-12">
    <h1 class="text-5xl font-bold text-center mb-12 font-doto">Portfolio</h1>
    
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {portfolioItems?.map((item) => (
        <button 
          class="portfolio-trigger group relative aspect-square w-full rounded-lg overflow-hidden block"
          data-image={item.image_url}
          data-title={item.title}
          data-desc={item.description}
        >
          <img src={item.image_url} alt={item.title} class="object-cover w-full h-full" loading="lazy" />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span class="text-white font-medium">View Details</span>
          </div>
        </button>
      ))}
    </div>
  </div>

  <!-- Native Modal -->
  <dialog id="portfolio-modal" class="backdrop:bg-black/80 rounded-lg p-0 bg-background max-w-4xl w-full max-h-[90vh]">
    <div class="relative">
      <button id="close-modal" class="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full">✕</button>
      <div class="grid md:grid-cols-2">
        <div class="bg-black flex items-center justify-center">
          <img id="modal-image" src="" alt="" class="max-h-[60vh] md:max-h-full w-auto object-contain" />
        </div>
        <div class="p-8">
          <h2 id="modal-title" class="text-2xl font-bold mb-4 font-doto"></h2>
          <p id="modal-desc" class="text-muted-foreground"></p>
        </div>
      </div>
    </div>
  </dialog>
</Layout>

<script>
  const modal = document.getElementById('portfolio-modal') as HTMLDialogElement;
  const closeBtn = document.getElementById('close-modal');
  const triggers = document.querySelectorAll('.portfolio-trigger');
  
  const modalImg = document.getElementById('modal-image') as HTMLImageElement;
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const img = trigger.getAttribute('data-image');
      const title = trigger.getAttribute('data-title');
      const desc = trigger.getAttribute('data-desc');

      if (modalImg) modalImg.src = img || '';
      if (modalTitle) modalTitle.innerText = title || '';
      if (modalDesc) modalDesc.innerText = desc || '';
      
      modal.showModal();
    });
  });

  closeBtn?.addEventListener('click', () => modal.close());
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || 
        e.clientY < rect.top || e.clientY > rect.bottom) {
      modal.close();
    }
  });
</script>
```

### Phase 5: Booking Form (Vanilla JS Wizard)

This replaces the complex React Hook Form with a multi-step HTML form controlled by Vanilla JS.

**`src/pages/booking.astro`**

```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Book Appointment">
  <div class="container mx-auto px-4 py-12 max-w-2xl">
    <h1 class="text-4xl font-bold mb-8 text-center font-doto">Booking Request</h1>
    
    <form id="booking-form" class="space-y-6">
      <!-- Step 1: Idea -->
      <div class="form-step" data-step="1">
        <h2 class="text-2xl mb-4">What's your tattoo idea?</h2>
        <textarea name="idea" class="w-full p-4 border rounded-md bg-background" rows="5" required></textarea>
        <button type="button" class="btn-next mt-4 bg-primary text-white px-6 py-2 rounded">Next</button>
      </div>

      <!-- Step 2: Placement & Size -->
      <div class="form-step hidden" data-step="2">
        <h2 class="text-2xl mb-4">Placement & Size</h2>
        <div class="grid gap-4">
          <input type="text" name="placement" placeholder="Placement (e.g., Forearm)" class="p-3 border rounded bg-background" required />
          <select name="size" class="p-3 border rounded bg-background" required>
            <option value="">Select Size</option>
            <option value="1-2 inches">1-2 inches</option>
            <option value="3-5 inches">3-5 inches</option>
            <option value="6+ inches">6+ inches</option>
          </select>
        </div>
        <div class="flex gap-4 mt-4">
          <button type="button" class="btn-prev border px-6 py-2 rounded">Back</button>
          <button type="button" class="btn-next bg-primary text-white px-6 py-2 rounded">Next</button>
        </div>
      </div>

      <!-- Step 3: Reference Photos -->
      <div class="form-step hidden" data-step="3">
        <h2 class="text-2xl mb-4">Reference Photos</h2>
        <input type="file" id="ref-photos" multiple accept="image/*" class="w-full" />
        <div class="flex gap-4 mt-4">
          <button type="button" class="btn-prev border px-6 py-2 rounded">Back</button>
          <button type="button" class="btn-next bg-primary text-white px-6 py-2 rounded">Next</button>
        </div>
      </div>

      <!-- Step 4: Contact Info -->
      <div class="form-step hidden" data-step="4">
        <h2 class="text-2xl mb-4">Your Details</h2>
        <div class="grid gap-4">
          <input type="text" name="first_name" placeholder="First Name" class="p-3 border rounded bg-background" required />
          <input type="text" name="last_name" placeholder="Last Name" class="p-3 border rounded bg-background" required />
          <input type="email" name="email" placeholder="Email" class="p-3 border rounded bg-background" required />
          <input type="tel" name="phone" placeholder="Phone" class="p-3 border rounded bg-background" required />
        </div>
        <div class="flex gap-4 mt-4">
          <button type="button" class="btn-prev border px-6 py-2 rounded">Back</button>
          <button type="submit" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">Submit Request</button>
        </div>
      </div>
    </form>
    
    <div id="loading-msg" class="hidden text-center mt-4">Submitting...</div>
    <div id="success-msg" class="hidden text-center mt-4 text-green-600">Booking sent successfully!</div>
  </div>
</Layout>

<script>
  import { supabase } from '../lib/supabase';

  let currentStep = 1;
  const steps = document.querySelectorAll('.form-step');
  
  // Navigation Logic
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      // Add validation check here based on currentStep inputs
      document.querySelector(`[data-step="${currentStep}"]`)?.classList.add('hidden');
      currentStep++;
      document.querySelector(`[data-step="${currentStep}"]`)?.classList.remove('hidden');
    });
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector(`[data-step="${currentStep}"]`)?.classList.add('hidden');
      currentStep--;
      document.querySelector(`[data-step="${currentStep}"]`)?.classList.remove('hidden');
    });
  });

  // Submission Logic
  const form = document.getElementById('booking-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('loading-msg')?.classList.remove('hidden');
    
    const formData = new FormData(form);
    const fileInput = document.getElementById('ref-photos') as HTMLInputElement;
    const uploadedUrls: string[] = [];

    // 1. Upload Images
    if (fileInput.files) {
      for (const file of Array.from(fileInput.files)) {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
        const { data, error } = await supabase.storage
          .from('reference-photos')
          .upload(fileName, file);
        
        if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('reference-photos')
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
      }
    }

    // 2. Insert Booking
    const { error } = await supabase.from('bookings').insert({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      tattoo_idea: formData.get('idea'),
      tattoo_placement: formData.get('placement'),
      tattoo_size: formData.get('size'),
      is_custom: true,
      reference_photos: uploadedUrls,
      status: 'pending'
    });

    document.getElementById('loading-msg')?.classList.add('hidden');
    
    if (!error) {
      form.classList.add('hidden');
      document.getElementById('success-msg')?.classList.remove('hidden');
    } else {
      alert('Error submitting booking: ' + error.message);
    }
  });
</script>
```

### Phase 6: Supabase Client Config

Create a helper file to use in your scripts.

**`src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Key Differences & Benefits

1.  **Routing:** No more `react-router-dom`. The file structure is the router. `src/pages/index.astro` is `/`, `src/pages/portfolio.astro` is `/portfolio`.
2.  **Performance:** The HTML is rendered on the server. The browser receives a fully painted page immediately, not a blank white screen waiting for React to load.
3.  **JavaScript:** Instead of importing `motion` and `useEffect` for everything, we use CSS transitions for hover effects and simple event listeners for modals/forms.
4.  **Admin:** For the Admin section, you would create `src/pages/admin/dashboard.astro` and verify the session in the frontmatter. If no session, redirect to `src/pages/admin/login.astro`.

This structure gives you the clean "No Framework" feel while using Astro as a powerful build tool to handle components and bundling.