(function() {
  // Cursor Aura
  const cursorAura = document.getElementById('cursorAura');
  if (cursorAura) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let auraX = mouseX;
    let auraY = mouseY;
    
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function animateAura() {
      // Smooth follow using lerp
      auraX += (mouseX - auraX) * 0.15;
      auraY += (mouseY - auraY) * 0.15;
      
      cursorAura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(animateAura);
    }
    
    animateAura();
  }

  // FX Stars Background
  const canvas = document.getElementById('fxStars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let stars = [];

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Star {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width;
        this.size = Math.random() * 1.5;
      }
      
      update() {
        this.z -= 0.5; // Speed of stars
        if (this.z <= 0) {
          this.z = width;
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
      }
      
      draw() {
        let x = (this.x - width / 2) * (width / this.z);
        let y = (this.y - height / 2) * (width / this.z);
        x += width / 2;
        y += height / 2;
        
        let s = this.size * (width / this.z);
        
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 228, 220, ${1 - this.z / width})`; // Cyan tint
        ctx.fill();
      }
    }

    for (let i = 0; i < 200; i++) {
      stars.push(new Star());
    }

    function animateStars() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach(star => {
        star.update();
        star.draw();
      });
      requestAnimationFrame(animateStars);
    }

    animateStars();
  }
})();
