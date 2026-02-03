/**
 * Carousel Module for moelholm.com
 * Manages Swiper.js carousel with dynamic color theming and progress bar animation
 * 
 * Browser Support: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
 * @version 2.0.0
 */
(function() {
  'use strict';
  
  // ==========================================================================
  // Color Utilities - Single Responsibility: Color manipulation and validation
  // ==========================================================================
  
  var ColorUtils = {
    /**
     * Validate hex color format
     * @param {string} hex - Hex color string
     * @returns {boolean} True if valid
     */
    isValidHex: function(hex) {
      return typeof hex === 'string' && /^#[0-9A-Fa-f]{6}$/.test(hex);
    },
    
    /**
     * Convert hex color to RGBA format
     * @param {string} hex - Hex color string (e.g., '#ff5733')
     * @param {number} alpha - Alpha value between 0 and 1
     * @returns {string} RGBA color string
     */
    hexToRgba: function(hex, alpha) {
      if (!this.isValidHex(hex)) {
        console.warn('Invalid hex color:', hex);
        return 'rgba(0, 0, 0, ' + alpha + ')';
      }
      
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    },
    
    /**
     * Darken a hex color by a percentage
     * @param {string} hex - Hex color string
     * @param {number} percent - Percentage to darken (0-1)
     * @returns {string} Darkened hex color
     */
    darkenColor: function(hex, percent) {
      if (!this.isValidHex(hex)) {
        console.warn('Invalid hex color:', hex);
        return '#000000';
      }
      
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      
      r = Math.floor(r * (1 - percent));
      g = Math.floor(g * (1 - percent));
      b = Math.floor(b * (1 - percent));
      
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      // Manual padding for browser compatibility (no padStart)
      var rr = ('0' + r.toString(16)).slice(-2);
      var gg = ('0' + g.toString(16)).slice(-2);
      var bb = ('0' + b.toString(16)).slice(-2);
      
      return '#' + rr + gg + bb;
    },
    
    /**
     * Derive complete color palette from a single base color
     * @param {string} baseColor - Base hex color
     * @returns {Object} Color palette object
     */
    deriveColorPalette: function(baseColor) {
      if (!this.isValidHex(baseColor)) {
        baseColor = '#3B82F6'; // Fallback to blue
      }
      
      return {
        primary: baseColor,
        inactiveGradient1: this.hexToRgba(baseColor, 0.02),
        inactiveGradient2: this.hexToRgba(baseColor, 0.05),
        activeGradient1: this.hexToRgba(baseColor, 0.40),
        activeGradient2: this.hexToRgba(baseColor, 0.55),
        activeText: this.darkenColor(baseColor, 0.30)
      };
    }
  };
  
  // ==========================================================================
  // Progress Bar Controller - Single Responsibility: Progress bar animation
  // ==========================================================================
  
  var ProgressBarController = {
    ANIMATION_DURATION: 10, // seconds
    ANIMATION_START_DELAY: 10, // milliseconds
    
    element: null,
    
    /**
     * Initialize the progress bar controller
     * @param {HTMLElement} progressBarElement - The progress bar DOM element
     */
    init: function(progressBarElement) {
      this.element = progressBarElement;
    },
    
    /**
     * Start progress bar animation from 0% to 100%
     */
    start: function() {
      if (!this.element) return;
      
      // Remove transition and reset to 0%
      this.element.classList.remove('animating');
      this.element.style.transition = 'none';
      this.element.style.width = '0%';
      
      // Force browser reflow
      void this.element.offsetWidth;
      
      // Add transition and prepare to animate
      this.element.classList.add('animating');
      this.element.style.transition = 'width ' + this.ANIMATION_DURATION + 's linear';
      
      // Defer width change to trigger transition
      var self = this;
      setTimeout(function() {
        if (self.element) {
          self.element.style.width = '100%';
        }
      }, this.ANIMATION_START_DELAY);
    },
    
    /**
     * Update progress bar color
     * @param {string} color - Hex color string
     */
    setColor: function(color) {
      if (!this.element || !ColorUtils.isValidHex(color)) return;
      
      var colorRgba = ColorUtils.hexToRgba(color, 0.6);
      this.element.style.background = 
        'linear-gradient(90deg, ' + colorRgba + ' 0%, ' + color + ' 100%)';
    }
  };
  
  // ==========================================================================
  // Navigation Controller - Single Responsibility: Navigation card styling
  // ==========================================================================
  
  var NavigationController = {
    cards: null,
    activeColor: null,
    
    /**
     * Initialize the navigation controller
     * @param {NodeList} navCards - Navigation card elements
     */
    init: function(navCards) {
      this.cards = navCards;
    },
    
    /**
     * Update active navigation card and apply styling
     * @param {number} realIndex - Swiper real index of active slide
     * @returns {string|null} Active color or null
     */
    updateActive: function(realIndex) {
      if (!this.cards) return null;
      
      // Remove active class from all cards
      for (var i = 0; i < this.cards.length; i++) {
        this.cards[i].classList.remove('active');
      }
      
      // Find and activate the matching card
      var activeCard = this._findCardByIndex(realIndex);
      if (!activeCard) return null;
      
      var activeColor = activeCard.getAttribute('data-color');
      if (!ColorUtils.isValidHex(activeColor)) {
        console.warn('Invalid color on card:', activeColor);
        return null;
      }
      
      activeCard.classList.add('active');
      this.activeColor = activeColor;
      
      // Apply color styling to all cards
      this._applyCardStyling(activeCard, activeColor);
      
      // Update bullet pagination colors
      this._updateBulletColors(activeColor);
      
      return activeColor;
    },
    
    /**
     * Find navigation card by slide index
     * @private
     * @param {number} realIndex - Slide index
     * @returns {HTMLElement|null} Card element or null
     */
    _findCardByIndex: function(realIndex) {
      for (var i = 0; i < this.cards.length; i++) {
        var slideIndex = parseInt(this.cards[i].getAttribute('data-slide-to'), 10);
        if (slideIndex === realIndex) {
          return this.cards[i];
        }
      }
      return null;
    },
    
    /**
     * Apply color styling to navigation cards
     * @private
     * @param {HTMLElement} activeCard - Active card element
     * @param {string} activeColor - Active color
     */
    _applyCardStyling: function(activeCard, activeColor) {
      var activePalette = ColorUtils.deriveColorPalette(activeColor);
      
      // Apply inactive colors to all cards
      for (var i = 0; i < this.cards.length; i++) {
        var card = this.cards[i];
        var cardColor = card.getAttribute('data-color');
        var cardPalette = ColorUtils.deriveColorPalette(cardColor);
        
        card.style.background = 'linear-gradient(135deg, ' + 
          cardPalette.inactiveGradient1 + ' 0%, ' + 
          cardPalette.inactiveGradient2 + ' 100%)';
        card.style.color = ColorUtils.hexToRgba(cardColor, 0.6);
      }
      
      // Apply active styling to active card
      activeCard.style.background = 'linear-gradient(135deg, ' + 
        activePalette.activeGradient1 + ' 0%, ' + 
        activePalette.activeGradient2 + ' 100%)';
      activeCard.style.color = activePalette.activeText;
    },
    
    /**
     * Update Swiper bullet pagination colors
     * @private
     * @param {string} activeColor - Active color
     */
    _updateBulletColors: function(activeColor) {
      // Use setTimeout to ensure bullets are rendered
      setTimeout(function() {
        var allBullets = document.querySelectorAll('.swiper-pagination-bullet');
        
        // Clear all bullet colors
        for (var i = 0; i < allBullets.length; i++) {
          allBullets[i].style.background = '';
        }
        
        // Set active bullet color
        var activeBullet = document.querySelector('.swiper-pagination-bullet-active');
        if (activeBullet && ColorUtils.isValidHex(activeColor)) {
          activeBullet.style.background = activeColor;
        }
      }, 50);
    }
  };
  
  // ==========================================================================
  // Title Color Controller - Single Responsibility: Slide title styling
  // ==========================================================================
  
  var TitleColorController = {
    DEFAULT_COLOR: '#374151',
    
    /**
     * Update slide title colors after transition
     * @param {string} activeColor - Active card color
     */
    updateTitleColors: function(activeColor) {
      if (!ColorUtils.isValidHex(activeColor)) {
        activeColor = this.DEFAULT_COLOR;
      }
      
      // Reset all titles to default color
      var allSlides = document.querySelectorAll('.swiper-slide');
      for (var i = 0; i < allSlides.length; i++) {
        var titles = allSlides[i].querySelectorAll('.post-title-link');
        for (var j = 0; j < titles.length; j++) {
          titles[j].style.setProperty('color', this.DEFAULT_COLOR, 'important');
        }
      }
      
      // Set active slide titles to active color
      var activeSlide = document.querySelector('.swiper-slide-active');
      if (activeSlide) {
        var activeTitles = activeSlide.querySelectorAll('.post-title-link');
        for (var k = 0; k < activeTitles.length; k++) {
          activeTitles[k].style.setProperty('color', activeColor, 'important');
        }
      }
    }
  };
  
  // ==========================================================================
  // Main Initialization Function - Open/Closed Principle: Extensible design
  // ==========================================================================
  
  function initSwiper() {
    // Validate dependencies
    if (typeof Swiper === 'undefined') {
      console.error('Swiper library not loaded!');
      return;
    }
    
    // Get required DOM elements
    var swiperContainer = document.getElementById('homeCarousel');
    if (!swiperContainer) return;
    
    var navCards = document.querySelectorAll('.carousel-nav-card');
    if (navCards.length === 0) return;
    
    var progressBar = document.querySelector('.carousel-progress__bar');
    
    // Initialize all controllers
    ProgressBarController.init(progressBar);
    NavigationController.init(navCards);
    
    // State management for initialization
    var state = {
      isInitialized: false,
      isFirstSlide: true
    };
    
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
            if (!state.isInitialized) return;
            
            // Skip progress bar reset on first slide to prevent race condition
            if (!state.isFirstSlide && progressBar) {
              progressBar.classList.remove('animating');
              progressBar.style.transition = 'none';
              progressBar.style.width = '0%';
              void progressBar.offsetWidth;
            }
            
            // Update navigation and get active color
            var activeColor = NavigationController.updateActive(this.realIndex);
            
            // Update progress bar color
            if (activeColor) {
              ProgressBarController.setColor(activeColor);
            }
            
            // Mark that we're past the first slide
            state.isFirstSlide = false;
          },
          slideChangeTransitionEnd: function() {
            if (!state.isInitialized) return;
            
            // Start progress bar animation
            ProgressBarController.start();
            
            // Update title colors
            if (NavigationController.activeColor) {
              TitleColorController.updateTitleColors(NavigationController.activeColor);
            }
          },
          init: function() {
            // Update navigation and get initial color
            var activeColor = NavigationController.updateActive(this.realIndex);
            
            // Mark as initialized
            state.isInitialized = true;
            
            // Initialize progress bar color and start animation
            if (activeColor) {
              ProgressBarController.setColor(activeColor);
            }
            ProgressBarController.start();
          }
        }
      });
      
      // Attach click handlers to navigation cards
      for (var i = 0; i < navCards.length; i++) {
        navCards[i].addEventListener('click', function(e) {
          e.preventDefault();
          var slideIndex = parseInt(this.getAttribute('data-slide-to'), 10);
          
          // Update active card
          for (var j = 0; j < navCards.length; j++) {
            navCards[j].classList.remove('active');
          }
          this.classList.add('active');
          
          // Navigate to slide
          swiper.slideToLoop(slideIndex);
        });
      }
      
      console.log('Swiper carousel ready with', navCards.length, 'navigation cards');
      
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
