(function() {
  'use strict';
  
  function initSwiper() {
    var swiperContainer = document.getElementById('homeCarousel');
    if (!swiperContainer) return;
    
    var teaserLinks = document.querySelectorAll('.carousel-teaser__item');
    
    // Initialize Swiper with progress bar pagination
    var swiper = new Swiper('#homeCarousel', {
      // Auto-rotation every 10 seconds
      autoplay: {
        delay: 10000,
        disableOnInteraction: true,
        pauseOnMouseEnter: true
      },
      
      // Progress bar pagination
      pagination: {
        el: '.swiper-pagination',
        type: 'progressbar'
      },
      
      // Smooth transitions
      speed: 600,
      effect: 'slide',
      
      // Keyboard navigation
      keyboard: {
        enabled: true
      },
      
      // Mouse wheel navigation
      mousewheel: {
        forceToAxis: true
      },
      
      // Events
      on: {
        slideChange: function() {
          updateActiveTeaserLink(this.activeIndex);
        },
        init: function() {
          updateActiveTeaserLink(this.activeIndex);
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
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwiper);
  } else {
    initSwiper();
  }
})();
