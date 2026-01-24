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
          },
          init: function() {
            updateActiveTeaserLink(this.realIndex);
            console.log('Swiper initialized successfully! Active index: ' + this.realIndex);
          },
          afterInit: function() {
            setTimeout(function() {
              restartProgressBar();
              console.log('Progress bar started after init');
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
        progressBar.style.background = '';
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
      
      function getColorPalette(color) {
        var palettes = {
          '#7a5b00': { lightBg1: '#fdfcf9', lightBg2: '#faf7f0', activeBg1: '#ffeb99', activeBg2: '#ffd966', activeText: '#5c4400' },
          '#cc4b00': { lightBg1: '#fffbf9', lightBg2: '#fff7f4', activeBg1: '#ffccb3', activeBg2: '#ffb399', activeText: '#a33d00' },
          '#3d4db3': { lightBg1: '#f9fafe', lightBg2: '#f5f7fe', activeBg1: '#c4ccff', activeBg2: '#b0bbff', activeText: '#2d3d8c' },
          '#1e7b58': { lightBg1: '#f9fefb', lightBg2: '#f3fcf7', activeBg1: '#c2ebd5', activeBg2: '#aee3c5', activeText: '#166044' },
          '#0f3166': { lightBg1: '#f9fcff', lightBg2: '#f2f8ff', activeBg1: '#b5daff', activeBg2: '#99c9ff', activeText: '#0a244d' }
        };
        return palettes[color] || palettes['#7a5b00'];
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
          var palette = getColorPalette(activeColor);
          
          // Apply inactive colors to all cards based on their own color
          navCards.forEach(function(card) {
            var cardColor = card.getAttribute('data-color');
            var cardPalette = getColorPalette(cardColor);
            card.style.background = 'linear-gradient(135deg, ' + cardPalette.lightBg1 + ' 0%, ' + cardPalette.lightBg2 + ' 100%)';
            card.style.color = hexToRgba(cardColor, 0.6);
          });
          
          // Apply active styling to the active card
          activeCard.style.background = 'linear-gradient(135deg, ' + palette.activeBg1 + ' 0%, ' + palette.activeBg2 + ' 100%)';
          activeCard.style.color = palette.activeText;
          
          // Update progress bar color
          if (progressBar) {
            var colorRgba = hexToRgba(activeColor, 0.6);
            progressBar.style.background = 'linear-gradient(90deg, ' + colorRgba + ' 0%, ' + activeColor + ' 100%)';
          }
          
          // Update active bullet color
          var activeBullet = document.querySelector('.swiper-pagination-bullet-active');
          if (activeBullet) {
            activeBullet.style.background = activeColor;
          }
          
          // Update card title colors
          var activeSlide = document.querySelector('.swiper-slide[data-slide-index="' + realIndex + '"]');
          if (activeSlide) {
            var titles = activeSlide.querySelectorAll('.home-post__title');
            titles.forEach(function(title) {
              title.style.color = activeColor;
            });
          }
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
