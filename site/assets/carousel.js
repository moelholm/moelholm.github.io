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
        
        // Enable loop so swiping past last slide goes to first
        loop: true,
        
        // Events - single point of control for all slide changes
        on: {
          // This fires at the START of slide change - reset progress bar and update link
          slideChange: function() {
            updateActiveTeaserLink(this.realIndex);
            resetProgressBar();
          },
          // This fires after transition completes - start progress bar animation
          slideChangeTransitionEnd: function() {
            startProgressBar();
          },
          // Initial setup - use afterInit to ensure everything is ready
          init: function() {
            updateActiveTeaserLink(this.realIndex);
            console.log('Swiper initialized successfully! Active index: ' + this.realIndex);
          },
          afterInit: function() {
            // Start progress bar after full initialization with small delay
            setTimeout(function() {
              restartProgressBar();
              console.log('Progress bar started after init');
            }, 100);
          },
          // Pause/resume progress bar on hover
          autoplayPause: function() {
            pauseProgressBar();
          },
          autoplayResume: function() {
            resumeProgressBar();
          }
        }
      });
      
      // Custom progress bar management - simplified and consolidated
      var progressBar = document.querySelector('.carousel-progress__bar');
      
      function resetProgressBar() {
        if (!progressBar) return;
        
        // Remove animation class
        progressBar.classList.remove('animating');
        
        // Clear any inline styles from previous operations
        progressBar.style.transition = '';
        progressBar.style.width = '0%';
        
        // Force reflow to ensure reset is applied
        void progressBar.offsetWidth;
      }
      
      function startProgressBar() {
        if (!progressBar) return;
        
        // Ensure we're at 0% first
        progressBar.style.width = '0%';
        
        // Force reflow
        void progressBar.offsetWidth;
        
        // Start animation
        progressBar.classList.add('animating');
        progressBar.style.width = '100%';
      }
      
      function restartProgressBar() {
        resetProgressBar();
        setTimeout(startProgressBar, 10);
      }
      
      function pauseProgressBar() {
        if (!progressBar) return;
        
        // Get current computed width and freeze it
        var currentWidth = window.getComputedStyle(progressBar).width;
        progressBar.classList.remove('animating');
        progressBar.style.width = currentWidth;
      }
      
      function resumeProgressBar() {
        if (!progressBar) return;
        
        // Get current width percentage
        var currentWidthPercent = parseFloat(progressBar.style.width) || 0;
        
        // If already at/near completion, restart fresh
        if (currentWidthPercent >= 99) {
          restartProgressBar();
          return;
        }
        
        // Calculate remaining time and resume
        var remainingPercent = 100 - currentWidthPercent;
        var remainingTime = (remainingPercent / 100) * 10000; // 10 seconds total
        
        // Apply calculated transition and resume to 100%
        progressBar.style.transition = 'width ' + (remainingTime / 1000) + 's linear';
        progressBar.style.width = '100%';
      }
      
      // Update active teaser link
      function updateActiveTeaserLink(realIndex) {
        for (var i = 0; i < teaserLinks.length; i++) {
          teaserLinks[i].classList.remove('active');
        }
        
        for (var j = 0; j < teaserLinks.length; j++) {
          var slideIndex = parseInt(teaserLinks[j].getAttribute('data-slide-to'), 10);
          if (slideIndex === realIndex) {
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
          
          // Clear all active states immediately for instant feedback
          for (var i = 0; i < teaserLinks.length; i++) {
            teaserLinks[i].classList.remove('active');
          }
          this.classList.add('active');
          
          // Navigate to slide (use slideToLoop for loop mode)
          swiper.slideToLoop(slideIndex);
          
          // Note: Progress bar resets in slideChange and starts in slideChangeTransitionEnd
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
