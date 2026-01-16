(function() {
  'use strict';
  
  function initSwiper() {
    // Check if Swiper library is loaded
    if (typeof Swiper === 'undefined') {
      console.error('Swiper library not loaded!');
      return;
    }
    
    var swiperContainer = document.getElementById('homeCarousel');
    if (!swiperContainer) {
      // No carousel on this page, silently return
      return;
    }
    
    var teaserLinks = document.querySelectorAll('.carousel-teaser__item');
    if (teaserLinks.length === 0) {
      console.warn('No teaser links found');
      return;
    }
    
    console.log('Initializing Swiper carousel...');
    console.log('Found container:', swiperContainer);
    console.log('Found', teaserLinks.length, 'teaser links');
    console.log('Swiper library version:', Swiper.version || 'unknown');
    
    try {
      // Initialize Swiper with bullet pagination and custom progress bar
      var swiper = new Swiper('#homeCarousel', {
        // Auto-rotation every 10 seconds
        autoplay: {
          delay: 10000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        
        // Bullet pagination (dots)
        pagination: {
          el: '.swiper-pagination',
          type: 'bullets',
          clickable: true,
          dynamicBullets: false
        },
        
        // Smooth transitions
        speed: 600,
        effect: 'slide',
        
        // Enable touch/swipe gestures
        touchEventsTarget: 'container',
        simulateTouch: true,
        
        // Keyboard navigation
        keyboard: {
          enabled: true,
          onlyInViewport: true
        },
        
        // Mouse wheel navigation  
        mousewheel: {
          enabled: true,
          forceToAxis: true,
          releaseOnEdges: true
        },
        
        // Loop disabled to match number of slides
        loop: false,
        
        // Events
        on: {
          slideChange: function() {
            updateActiveTeaserLink(this.activeIndex);
            resetProgressBar();
            console.log('Slide changed to index:', this.activeIndex);
          },
          init: function() {
            updateActiveTeaserLink(this.activeIndex);
            resetProgressBar();
            console.log('Swiper initialized successfully! Active index: ' + this.activeIndex);
            console.log('Total slides:', this.slides.length);
            console.log('Autoplay enabled:', this.autoplay.running);
          },
          autoplayStart: function() {
            startProgressBar();
            console.log('Autoplay started');
          },
          autoplayStop: function() {
            pauseProgressBar();
            console.log('Autoplay stopped');
          },
          autoplayPause: function() {
            pauseProgressBar();
          },
          autoplayResume: function() {
            resumeProgressBar();
          }
        }
      });
      
      // Custom progress bar management
      var progressBar = document.querySelector('.carousel-progress__bar');
      var progressBarAnimation = null;
      
      function resetProgressBar() {
        if (!progressBar) return;
        
        // Remove animation class
        progressBar.classList.remove('animating');
        
        // Force reflow
        void progressBar.offsetWidth;
        
        // Reset to 0%
        progressBar.style.width = '0%';
      }
      
      function startProgressBar() {
        if (!progressBar) return;
        
        // Reset first
        resetProgressBar();
        
        // Small delay to ensure reset is rendered
        setTimeout(function() {
          progressBar.classList.add('animating');
          progressBar.style.width = '100%';
        }, 50);
      }
      
      function pauseProgressBar() {
        if (!progressBar) return;
        
        // Get current width and freeze it
        var currentWidth = window.getComputedStyle(progressBar).width;
        progressBar.classList.remove('animating');
        progressBar.style.width = currentWidth;
      }
      
      function resumeProgressBar() {
        if (!progressBar) return;
        
        // Calculate remaining time based on current width
        var currentWidthPercent = parseFloat(progressBar.style.width) || 0;
        var remainingPercent = 100 - currentWidthPercent;
        var remainingTime = (remainingPercent / 100) * 10000; // 10 seconds total
        
        // Resume animation with remaining time
        progressBar.style.transition = 'width ' + (remainingTime / 1000) + 's linear';
        progressBar.style.width = '100%';
      }
      
      // Update active teaser link
      function updateActiveTeaserLink(activeIndex) {
        for (var i = 0; i < teaserLinks.length; i++) {
          teaserLinks[i].classList.remove('active');
        }
        
        for (var j = 0; j < teaserLinks.length; j++) {
          var slideIndex = parseInt(teaserLinks[j].getAttribute('data-slide-to'), 10);
          if (slideIndex === activeIndex) {
            teaserLinks[j].classList.add('active');
            break;
          }
        }
      }
      
      // Click handlers for teaser links
      teaserLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var slideIndex = parseInt(this.getAttribute('data-slide-to'), 10);
          
          // Clear all active states immediately
          for (var i = 0; i < teaserLinks.length; i++) {
            teaserLinks[i].classList.remove('active');
          }
          this.classList.add('active');
          
          // Navigate to slide
          swiper.slideTo(slideIndex);
          
          // Reset and start progress bar
          resetProgressBar();
          
          // Resume autoplay after manual navigation
          swiper.autoplay.start();
        });
      });
      
      console.log('Swiper carousel ready with ' + teaserLinks.length + ' navigation links');
      
    } catch (error) {
      console.error('Error initializing Swiper:', error);
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwiper);
  } else {
    initSwiper();
  }
})();
