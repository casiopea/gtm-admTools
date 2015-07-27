// 23 Jun 2015

EWD.bootstrap3 = {
  createMenu: function() {
    if (typeof EWD.application.menuOptions === 'undefined') return;
    if (document.getElementById('ewd-mainMenu') && !EWD.application.menuCreated) {
      var option;
      var i;
      for (i = 0; i < EWD.application.menuOptions.length; i++) {
        option = EWD.application.menuOptions[i];
        var li = document.createElement('li');
        li.setAttribute('id', 'menu-' + i);
        if (option.active) {
          li.setAttribute('class', 'active ewd-menu');
          EWD.application.activeMenu = 'menu-' + i;
        }
        else {
          li.setAttribute('class', 'ewd-menu');
        }
        var a = document.createElement('a');
        a.setAttribute('href', '#');
        a.innerHTML = option.text;
        li.appendChild(a);
        document.getElementById('ewd-mainMenu').appendChild(li);
      }
      EWD.application.menuCreated = true;
    }
  },

  /* navigation functionality
     * Navbar needs id of 'navList'
     * Navbar buttons need suffix of '[id]_Nav'
     * Footer needs div wrapper with id of '#footerLinks'
     * Footer buttons need suffix of '[id]_Footer'
     * navbar and footer buttons will then switch the current container with '[id]_Container'
     * during animation navbar & footer buttons are disabled
     * if targetId does not have the _Nav suffix the button is ignored to allow for a custom event 
  */
  nav: {
    // swap pages from current to target
    // targetId = string ID of clicked navbar/footer link (e.g. ewd_Nav/ewd_Footer)
    pageSwap: function(targetId) {
      var targetSuffix = targetId.split('_')[1];
      if (typeof targetSuffix === 'undefined') {
        if (targetSuffix !== 'Nav' && targetSuffix !== 'Footer') {
          return;
        }
      }
      if (targetSuffix == 'Parent') return;
      if ($('#' + targetId).data('link')) {
        var link = $('#' + targetId).data('link');
        window.open(link);
        return;
      }
      // console.log('pageSwap - targetId = ' + targetId);
      var current = EWD.bootstrap3.nav.getCurrentPage();
      // console.log('current: ' + current);
      var target = targetId.split('_')[0];
      // console.log('target: ' + target);
      if (target !== current) {
        var currentRef = '#' + current + '_Container';
        var targetRef = '#' + target + '_Container';        
        $('#' + current + '_Container').on('hidden.bs.collapse', function() {
          $('#' + target + '_Container').on('shown.bs.collapse', function() {
            EWD.bootstrap3.nav.enable();
            $('#' + target + '_Container').unbind();
            if (EWD.application.onAfterPageSwap && typeof EWD.application.onAfterPageSwap[target] === 'function') EWD.application.onAfterPageSwap[target](current,target);
            if (typeof EWD.application.onAfterAnyPageSwap === 'function') EWD.application.onAfterAnyPageSwap(current,target);
          });
          $('#' + target + '_Container').collapse('show');
          $('#' + current + '_Container').unbind();
        });
        EWD.bootstrap3.nav.disable();
        $('#' + current + '_Container').collapse('hide');
        $('#' + current + '_Nav').removeClass('active');
        $('#' + target + '_Nav').addClass('active');
      }
      if (typeof EWD.application.navFragments[target] !== 'undefined') {
        var params = EWD.application.navFragments[target];
        if (!params.file) params.file = target + '.html';
        if (!params.targetId) params.targetId = target + '_Container';
        if (!params.fragmentOuterId) params.fragmentOuterId = target + 'PageLoaded';
        var loadFragment = function(params) {
          EWD.sockets.sendMessage({
            type: "EWD.getFragment", 
            params:  {
              file: params.file,
              targetId: params.targetId
            }
          });
        }
        if (params.cache) {
          if ($('#' + params.fragmentOuterId).length === 0) {
            loadFragment(params);
          }
        }
        else {
          loadFragment(params);
        }
      }
      //if (EWD.application.onPageSwap) EWD.application.onPageSwap(target);
      if (EWD.application.onPageSwap) {
        if (EWD.application.onPageSwap[target]) EWD.application.onPageSwap[target]();
        if (EWD.application.onAnyPageSwap) EWD.application.onAnyPageSwap();
      } 
    },
    // initialise navbar & footer buttons
    enable: function(ttopt) {
      if ($('#navList')) {
        $('#navList').children().each(function() { // add listener to each navbar button
          var that = this;
          var navId = that.id;
          var navSuffix = navId.split('_')[1];
          if (navSuffix == 'Parent') {
            // console.log('navId=',navId);
            $('#' + navId + ' ul').children().each(function(){
              var pthat = this;
              // console.log('pthat id=',pthat.id);
              if ($(pthat).data('toggle') === 'tooltip') {
                $(pthat).tooltip(ttopt);
              }
              $('#' + pthat.id).on('click', function() {
                EWD.bootstrap3.nav.pageSwap(pthat.id);
              });
            });
          } else {
            if ($(that).data('toggle') === 'tooltip') {
              $(that).tooltip(ttopt);
            }
            $('#' + that.id).on('click', function() {
              EWD.bootstrap3.nav.pageSwap(that.id);
            });
          }
        });
      }
      if ($('#footerLinks')) {
        $('#footerLinks').children().each(function() { // add listener to each footer button
          $('#' + this.id).on('click', function() {
            EWD.bootstrap3.nav.pageSwap(this.id);
          });
        });
      }
    },
    // disable navbar buttons
    disable: function() {
      if ($('#navList')) {
        $('#navList').children().each(function() {
          var that = this;
          var navId = that.id;
          var navSuffix = navId.split('_')[1];
          if (navSuffix == 'Parent') {
            $('#' + navId + ' ul').children().each(function(){
              var pthat = this;
              $('#' + pthat.id).unbind();
              if ($(pthat).data('toggle') === 'tooltip') {
                $(pthat).tooltip('destroy');
              }
            });
          } else {
            $('#' + that.id).unbind();
            if ($(that).data('toggle') === 'tooltip') {
              $(that).tooltip('destroy');
            }
          }
        });
      }
      if ($('#footerLinks')) {
        $('#footerLinks').children().each(function() {
          $('#' + this.id).unbind();
        });
      }
    },
    // find which page container is currently open
    getCurrentPage: function() {
      var current;
      var id;
      $('#content').children().each(function() {
        id = this.id.split('_')[0];
        if ($('#' + id + '_Container').hasClass('in')) {
          current = this.id.split('_')[0];
        }
      });
      return current;
    }
  }

};

EWD.onSocketsReady = function() {
  EWD.application.topPanelActivated = false;
  EWD.application.menuCreated = false;
  EWD.application.framework = 'bootstrap';

  for (id in EWD.application.labels) {
    try {
      document.getElementById(id).innerHTML = EWD.application.labels[id];
    }
    catch(err) {}
  }
  // everything is ready to go:
  // activate login button and the user can start interacting
  if (EWD.application.onStartup) EWD.application.onStartup();
};

EWD.onSocketMessage = function(messageObj) {
  if (EWD.application.messageHandlers) EWD.application.messageHandlers(messageObj);
};

