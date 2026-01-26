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
    
    try {
      var swiper = new Swiper('#homeCarousel', {
        autoplay: {
          delay: 10000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
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
            updateActiveTeaserLink(this.realIndex);
            resetProgressBar();
          },
          slideChangeTransitionEnd: function() {
            startProgressBar();
            
            // Update card title colors after transition completes
            if (window.carouselActiveColor) {
              // Clear all titles first
              var allSlides = document.querySelectorAll('.swiper-slide');
              allSlides.forEach(function(slide) {
                var titles = slide.querySelectorAll('.post-title-link');
                titles.forEach(function(title) {
                  title.style.color = ''; // Clear previous color
                });
              });
              
              // Set color for active slide titles
              var activeSlide = document.querySelector('.swiper-slide-active');
              if (activeSlide) {
                var titles = activeSlide.querySelectorAll('.post-title-link');
                titles.forEach(function(title) {
                  title.style.color = window.carouselActiveColor;
                });
              }
            }
          },
          init: function() {
            console.log('Swiper initialized successfully! Active index: ' + this.realIndex);
            var self = this;
            // Apply initial styling for nav cards immediately
            updateActiveTeaserLink(self.realIndex);
            // Start progress bar after a short delay to ensure DOM is ready
            setTimeout(function() {
              restartProgressBar();
              console.log('Progress bar started after init with index: ' + self.realIndex);
            }, 100);
          },
          autoplayPause: function() {
            pauseProgressBar();
          },
          autoplayResume: function() {
            resumeProgressBar();
          }
        }
      });
      
      var progressBar = document.querySelector('.carousel-progress__bar');
      
      function resetProgressBar() {
        if (!progressBar) return;
        progressBar.classList.remove('animating');
        progressBar.style.transition = '';
        progressBar.style.width = '0%';
        // Don't clear background - keep the color set by updateActiveTeaserLink
        void progressBar.offsetWidth;
      }
      
      function startProgressBar() {
        if (!progressBar) return;
        progressBar.style.width = '0%';
        void progressBar.offsetWidth;
        progressBar.classList.add('animating');
        progressBar.style.width = '100%';
      }
      
      function restartProgressBar() {
        resetProgressBar();
        setTimeout(startProgressBar, 10);
      }
      
      function pauseProgressBar() {
        if (!progressBar) return;
        var currentWidth = window.getComputedStyle(progressBar).width;
        progressBar.classList.remove('animating');
        progressBar.style.width = currentWidth;
      }
      
      function resumeProgressBar() {
        if (!progressBar) return;
        var currentWidthPercent = parseFloat(progressBar.style.width) || 0;
        
        if (currentWidthPercent >= 99) {
          restartProgressBar();
          return;
        }
        
        var remainingPercent = 100 - currentWidthPercent;
        var remainingTime = (remainingPercent / 100) * 10000;
        progressBar.style.transition = 'width ' + (remainingTime / 1000) + 's linear';
        progressBar.style.width = '100%';
      }
      
      function hexToRgba(hex, alpha) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
      }
      
      function getColorPaletteFromCard(card) {
        return {
          lightBg1: card.getAttribute('data-light-bg1'),
          lightBg2: card.getAttribute('data-light-bg2'),
          activeBg1: card.getAttribute('data-active-bg1'),
          activeBg2: card.getAttribute('data-active-bg2'),
          activeText: card.getAttribute('data-active-text')
        };
      }
      
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
          var activePalette = getColorPaletteFromCard(activeCard);
          
          // Apply inactive colors to all cards from their own data attributes
          navCards.forEach(function(card) {
            var cardColor = card.getAttribute('data-color');
            var cardPalette = getColorPaletteFromCard(card);
            card.style.background = 'linear-gradient(135deg, ' + cardPalette.lightBg1 + ' 0%, ' + cardPalette.lightBg2 + ' 100%)';
            card.style.color = hexToRgba(cardColor, 0.6);
          });
          
          // Apply active styling to the active card from its data attributes
          activeCard.style.background = 'linear-gradient(135deg, ' + activePalette.activeBg1 + ' 0%, ' + activePalette.activeBg2 + ' 100%)';
          activeCard.style.color = activePalette.activeText;
          
          // Update progress bar color
          if (progressBar) {
            var colorRgba = hexToRgba(activeColor, 0.6);
            progressBar.style.background = 'linear-gradient(90deg, ' + colorRgba + ' 0%, ' + activeColor + ' 100%)';
          }
          
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
      
      // Force immediate styling update after swiper is fully initialized
      setTimeout(function() {
        updateActiveTeaserLink(swiper.realIndex);
        
        // Also update card titles initially
        setTimeout(function() {
          if (window.carouselActiveColor) {
            var activeSlide = document.querySelector('.swiper-slide-active');
            if (activeSlide) {
              var titles = activeSlide.querySelectorAll('.post-title-link');
              titles.forEach(function(title) {
                title.style.color = window.carouselActiveColor;
              });
            }
          }
        }, 100);
      }, 200);
      
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
