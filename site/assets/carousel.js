(function() {
  'use strict';
  
  function initSwiper() {
    if (typeof Swiper === 'undefined') {
      console.error('Swiper library not loaded!');
      return;
    }
    
    var swiperContainer = document.getElementById('homeCarousel');
    if (!swiperContainer) {
      return;
    }
    
    var navCards = document.querySelectorAll('.carousel-nav-card');
    if (navCards.length === 0) {
      console.warn('No navigation cards found');
      return;
    }
    
    console.log('Initializing Swiper carousel...');
    console.log('Found container:', swiperContainer);
    console.log('Found', navCards.length, 'navigation cards');
    console.log('Swiper library version:', Swiper.version || 'unknown');
    
    // Get progress bar reference BEFORE creating Swiper so it's available in event handlers
    var progressBar = document.querySelector('.carousel-progress__bar');
    
    // Track initialization state to prevent race conditions
    var isInitialized = false;
    
    // Helper functions defined before Swiper creation so they're available in event handlers
    function hexToRgba(hex, alpha) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
    
    function darkenColor(hex, percent) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      
      r = Math.floor(r * (1 - percent));
      g = Math.floor(g * (1 - percent));
      b = Math.floor(b * (1 - percent));
      
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      var rr = r.toString(16).padStart(2, '0');
      var gg = g.toString(16).padStart(2, '0');
      var bb = b.toString(16).padStart(2, '0');
      
      return '#' + rr + gg + bb;
    }
    
    function deriveColorPalette(baseColor) {
      // Derive all color variations from a single base color
      return {
        primary: baseColor,
        inactiveGradient1: hexToRgba(baseColor, 0.02),  // Very light tint for inactive bg start
        inactiveGradient2: hexToRgba(baseColor, 0.05),  // Slightly darker tint for inactive bg end
        activeGradient1: hexToRgba(baseColor, 0.40),    // Medium tint for active bg start
        activeGradient2: hexToRgba(baseColor, 0.55),    // Darker tint for active bg end
        activeText: darkenColor(baseColor, 0.30)         // Darkened version for text (30% darker)
      };
    }
    
    // ==============================================================================
    // PROGRESS BAR MANAGEMENT - Simplified for reliable operation
    // ==============================================================================
    
    function startProgressBar() {
      if (!progressBar) return;
      
      // Step 1: Remove any existing transition and set to 0% WITHOUT animation
      progressBar.classList.remove('animating');
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      
      // Step 2: Force browser to render the 0% state
      void progressBar.offsetWidth;
      
      // Step 3: Add animation class and set transition duration
      progressBar.classList.add('animating');
      progressBar.style.transition = 'width 10s linear';
      
      // Step 4: Use setTimeout to defer width change to ensure transition triggers
      setTimeout(function() {
        progressBar.style.width = '100%';
      }, 10);
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
      var currentWidthPercent = parseFloat(progressBar.style.width) || 0;
      
      if (currentWidthPercent >= 95) {
        // Near completion - just restart
        startProgressBar();
        return;
      }
      
      // Calculate remaining time based on current progress
      var remainingPercent = 100 - currentWidthPercent;
      var remainingTime = (remainingPercent / 100) * 10; // 10 seconds total
      
      // Resume with adjusted transition duration
      progressBar.classList.add('animating');
      progressBar.style.transition = 'width ' + remainingTime + 's linear';
      progressBar.style.width = '100%';
    }
    
    try {
      var swiper = new Swiper('#homeCarousel', {
        autoplay: {
          delay: 10000,
          disableOnInteraction: false
        },
        pagination: {
          el: '.swiper-pagination',
          type: 'bullets',
          clickable: true,
          dynamicBullets: false
        },
        speed: 600,
        effect: 'slide',
        touchEventsTarget: 'container',
        simulateTouch: true,
        keyboard: {
          enabled: true,
          onlyInViewport: true
        },
        mousewheel: {
          enabled: true,
          forceToAxis: true,
          releaseOnEdges: true
        },
        loop: true,
        on: {
          slideChange: function() {
            // Update styling immediately on slide change
            if (isInitialized) {
              updateActiveTeaserLink(this.realIndex);
            }
          },
          slideChangeTransitionEnd: function() {
            // Update progress bar color after transition completes (bar is at 0%)
            if (window.carouselActiveColor && progressBar) {
              var colorRgba = hexToRgba(window.carouselActiveColor, 0.6);
              progressBar.style.background = 'linear-gradient(90deg, ' + colorRgba + ' 0%, ' + window.carouselActiveColor + ' 100%)';
            }
            
            // Start progress bar now that card is fully showing
            if (isInitialized) {
              startProgressBar();
            }
            
            // Update card title colors after transition completes
            if (window.carouselActiveColor) {
              // Reset all titles to default content link color first
              var allSlides = document.querySelectorAll('.swiper-slide');
              allSlides.forEach(function(slide) {
                var titles = slide.querySelectorAll('.post-title-link');
                titles.forEach(function(title) {
                  title.style.setProperty('color', '#374151', 'important');
                });
              });
              
              // Set color for active slide titles
              var activeSlide = document.querySelector('.swiper-slide-active');
              if (activeSlide) {
                var titles = activeSlide.querySelectorAll('.post-title-link');
                titles.forEach(function(title) {
                  title.style.setProperty('color', window.carouselActiveColor, 'important');
                });
              }
            }
          },
          init: function() {
            console.log('Swiper initialized successfully! Active index: ' + this.realIndex);
            var self = this;
            
            // Apply initial styling for nav cards immediately
            updateActiveTeaserLink(self.realIndex);
            
            // Mark as initialized to allow normal slide change behavior
            isInitialized = true;
            
            // Initialize progress bar color BEFORE starting animation
            if (window.carouselActiveColor && progressBar) {
              var colorRgba = hexToRgba(window.carouselActiveColor, 0.6);
              progressBar.style.background = 'linear-gradient(90deg, ' + colorRgba + ' 0%, ' + window.carouselActiveColor + ' 100%)';
            }
            
            // Start progress bar - use direct approach optimized for page load
            // The CSS transition will handle the animation smoothly
            startProgressBar();
            
            console.log('Progress bar started. Index: ' + self.realIndex);
          },
          autoplayPause: function() {
            pauseProgressBar();
          },
          autoplayResume: function() {
            resumeProgressBar();
          }
        }
      });
      
      function updateActiveTeaserLink(realIndex) {
        for (var i = 0; i < navCards.length; i++) {
          navCards[i].classList.remove('active');
        }
        
        var activeCard = null;
        var activeColor = null;
        
        for (var j = 0; j < navCards.length; j++) {
          var slideIndex = parseInt(navCards[j].getAttribute('data-slide-to'), 10);
          if (slideIndex === realIndex) {
            activeCard = navCards[j];
            activeColor = navCards[j].getAttribute('data-color');
            break;
          }
        }
        
        if (activeCard && activeColor) {
          activeCard.classList.add('active');
          var activePalette = deriveColorPalette(activeColor);
          
          // Apply inactive colors to all cards
          navCards.forEach(function(card) {
            var cardColor = card.getAttribute('data-color');
            var cardPalette = deriveColorPalette(cardColor);
            card.style.background = 'linear-gradient(135deg, ' + cardPalette.inactiveGradient1 + ' 0%, ' + cardPalette.inactiveGradient2 + ' 100%)';
            card.style.color = hexToRgba(cardColor, 0.6);
          });
          
          // Apply active styling to the active card
          activeCard.style.background = 'linear-gradient(135deg, ' + activePalette.activeGradient1 + ' 0%, ' + activePalette.activeGradient2 + ' 100%)';
          activeCard.style.color = activePalette.activeText;
          
          // DON'T update progress bar color here - do it in slideChangeTransitionEnd
          // This prevents the color from changing while the bar is still animating
          
          // Update bullet colors - clear all first, then set active
          setTimeout(function() {
            var allBullets = document.querySelectorAll('.swiper-pagination-bullet');
            allBullets.forEach(function(bullet) {
              bullet.style.background = ''; // Clear any previous color
            });
            var activeBullet = document.querySelector('.swiper-pagination-bullet-active');
            if (activeBullet) {
              activeBullet.style.background = activeColor;
            }
          }, 50);
          
          // Store the color for later use in slideChangeTransitionEnd
          window.carouselActiveColor = activeColor;
        }
      }
      
      // Click handlers for navigation cards
      navCards.forEach(function(card) {
        card.addEventListener('click', function(e) {
          e.preventDefault();
          var slideIndex = parseInt(this.getAttribute('data-slide-to'), 10);
          
          for (var i = 0; i < navCards.length; i++) {
            navCards[i].classList.remove('active');
          }
          this.classList.add('active');
          
          swiper.slideToLoop(slideIndex);
        });
      });
      
      console.log('Swiper carousel ready with ' + navCards.length, 'navigation cards');
      
    } catch (error) {
      console.error('Error initializing Swiper:', error);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwiper);
  } else {
    initSwiper();
  }
})();
