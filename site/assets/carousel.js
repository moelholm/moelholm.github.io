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
      // Initialize Swiper with progress bar pagination
      var swiper = new Swiper('#homeCarousel', {
        // Auto-rotation every 10 seconds
        autoplay: {
          delay: 10000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        
        // Progress bar pagination
        pagination: {
          el: '.swiper-pagination',
          type: 'progressbar',
          progressbarOpposite: false
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
            console.log('Slide changed to index:', this.activeIndex);
          },
          init: function() {
            updateActiveTeaserLink(this.activeIndex);
            console.log('Swiper initialized successfully! Active index: ' + this.activeIndex);
            console.log('Total slides:', this.slides.length);
            console.log('Autoplay enabled:', this.autoplay.running);
          },
          autoplayStart: function() {
            console.log('Autoplay started');
          },
          autoplayStop: function() {
            console.log('Autoplay stopped');
          }
        }
      });
      
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
