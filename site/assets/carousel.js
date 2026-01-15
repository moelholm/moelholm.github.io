(function() {
  'use strict';
  
  var CAROUSEL_INTERVAL = 10000;
  var INIT_DELAY = 100;
  var RESET_DELAY = 50;
  
  function initCarousel() {
    var carousel = document.getElementById('homeCarousel');
    if (!carousel) return;
    
    var progressBar = document.querySelector('.carousel-progress__bar');
    var teaserLinks = document.querySelectorAll('.carousel-teaser__item');
    var carouselDots = document.querySelectorAll('.carousel-indicators li');
    
    function updateActiveTeaserLink() {
      var allSlides = carousel.querySelectorAll('.carousel-item');
      var currentIndex = -1;
      
      for (var k = 0; k < allSlides.length; k++) {
        if (allSlides[k].classList.contains('active')) {
          currentIndex = k;
          break;
        }
      }
      
      if (currentIndex === -1) return;
      
      for (var i = 0; i < teaserLinks.length; i++) {
        teaserLinks[i].classList.remove('active');
      }
      
      for (var j = 0; j < teaserLinks.length; j++) {
        if (teaserLinks[j].getAttribute('data-slide-to') === currentIndex.toString()) {
          teaserLinks[j].classList.add('active');
          break;
        }
      }
    }
    
    function resetProgressBar() {
      if (!progressBar) return;
      progressBar.classList.remove('animating');
      progressBar.style.width = '0%';
      void progressBar.offsetWidth;
      progressBar.classList.add('animating');
    }
    
    function handleSlideChange(event) {
      var targetIndex = event.to !== undefined ? event.to.toString() : null;
      
      if (targetIndex !== null) {
        for (var i = 0; i < teaserLinks.length; i++) {
          teaserLinks[i].classList.remove('active');
        }
        
        for (var j = 0; j < teaserLinks.length; j++) {
          if (teaserLinks[j].getAttribute('data-slide-to') === targetIndex) {
            teaserLinks[j].classList.add('active');
            break;
          }
        }
      }
      
      resetProgressBar();
    }
    
    if (typeof $ !== 'undefined' && $.fn.on) {
      $(carousel).on('slide.bs.carousel', handleSlideChange);
    } else {
      carousel.addEventListener('slide.bs.carousel', handleSlideChange);
    }
    
    teaserLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        var targetSlide = this.getAttribute('data-slide-to');
        
        for (var i = 0; i < teaserLinks.length; i++) {
          teaserLinks[i].classList.remove('active');
        }
        this.classList.add('active');
        
        setTimeout(resetProgressBar, RESET_DELAY);
      });
    });
    
    carouselDots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        setTimeout(resetProgressBar, RESET_DELAY);
      });
    });
    
    setTimeout(function() {
      updateActiveTeaserLink();
      resetProgressBar();
    }, INIT_DELAY);
  }
  
  document.addEventListener('DOMContentLoaded', initCarousel);
})();
