EWD.sockets.log = true;

EWD.application = {
    name: 'gtm-admTools',
    timeout: 3600,
    login: true,
    labels: {
        'ewd-title': 'GT.M  Admin Tools',
        'ewd-navbar-title-phone': 'GT.M admTools',
        'ewd-navbar-title-other': 'GT.M admTools'
    },
    loginType : 'ewdMonitor' ,  // set 'ewdMonitor', if you use ewdMonitor Users's login 'user' and 'password'.
    navFragments: {
      gde: { cache: true }, mupip: { cache: true }, lke:{ cache: true }, about: { cache: true }
    },
    maxlkeResultPreAreaLength: 500,
    lkeClearParams: {},
    gdeRJSNM:{ 'Region': 'gdeRegion', 'Journal': 'gdeJournal',
               'Segment': 'gdeSegment', 'Names': 'gdeNames', 
               'Map': 'gdeMap',
               'MinMaxReg': 'gdeMaxMin-Region', 
               'MinMaxSeg': 'gdeMaxMin-Segment' },
    Login: function(event){
        event.preventDefault();
        var username = $('#txtUsername').val();
        var password = $('#txtPassword').val();
        EWD.sockets.sendMessage({
            type: 'Login',
            params: {
                username: username,
                password: password,
                loginType: EWD.application.loginType,
                authorization: EWD.application.authorization
            }
        });
    },
    logOut: function(event){
        event.preventDefault();
        EWD.sockets.sendMessage({
         type: 'EWD.logout'
        });
        $('#logoutConfirmPanel').modal('hide');
        $('#navList li').hide();
        $('#content .container').hide();
        $('#fin_Container').show();
    },
    sessionDeleted: function(event){
        event.preventDefault();
        $('#deleteConfirmPanel').modal('hide');
        $('#navList li').hide();
        $('#content .container').hide();
        $('#fin_Container').show();
    },
    openLogOutModal: function(event){
        event.preventDefault();
        var btnlogOut = true;
        if (btnlogOut) {
            $('#logoutConfirmPanel').modal({
                keyboard: false,
                backdrop: 'static'
            });
        }
    },
    initFragment: function(event){
      EWD.sockets.sendMessage({
        type: "EWD.getFragment", 
        params:  { file: 'html/gde/gde_navTab.html', targetId: 'gde_Container' },
        done: function(messageObj) {
            $.each(EWD.application.gdeRJSNM, function(key, value) {
              EWD.sockets.sendMessage({
                type: "EWD.getFragment", 
                params: { file: 'html/gde/gde_' + key + 'Table.html', targetId: key + 'Content' }
              });
            });
        }
      });
      EWD.sockets.sendMessage({
        type: "EWD.getFragment", 
        params:  { file: 'html/mupip/mupip_navTab.html', targetId: 'mupip_Container' }
      });

      EWD.getFragment('html/lke/lke.html', 'lke_Container'); 
      EWD.getFragment('html/lke/lkeClearConfirm.html', 'lkeClearConfirmModal'); 
      EWD.getFragment('html/dse/dse.html', 'dse_Container'); 
      EWD.getFragment('html/sysUtils/sysUtils_FreeCntTable.html', 'FreeCnt_Container'); 
      EWD.getFragment('html/sysUtils/sysUtils_GtmEnvTable.html', 'GtmEnv_Container'); 
      EWD.getFragment('html/fin.html', 'fin_Container'); 
      EWD.getFragment('html/about.html', 'about_Container'); 
      EWD.getFragment('html/login.html', 'loginModal');
      EWD.getFragment('html/logout.html', 'logoutConfirmPanel');
      EWD.getFragment('html/balus.html', 'deleteConfirmPanel');
    },
    gdeShowAallFormatter: function(value){
      var field = this.field;
      if (field == 'STDNULLCOLL' || field == 'JOURNAL' || field == 'BEFORE_IMAGE') {
        value = value == "1" ? "Y" : "N";
      }
      if (field == 'INST_FREEZE_ON_ERROR' || field == 'QDBRUNDOWN') {
        value = value == "0" ? "DISABLED" : "ABLED";
      }
      if (field == 'NULL_SUBSCRIPTS') {
        value = value == "0" ? "NEVER" : "ALWAYS";
      }
      if (field == 'ENCRYPTION_FLAG') {
        value = value == "0" ? "OFF" : "ON";
      }
      return value;
    },
    gdeShowAall: function(event){
      var cntHeight = $("#fin_Container").height() - 200;
      // console.log('ContentHeight = ', cntHeight);
      EWD.sockets.sendMessage({
        type : 'GDshowAll',
        params: {},
        done: function(messageObj) {
          var id = '';
          $.each(EWD.application.gdeRJSNM, function(key, tid) {
            id = '#' + tid + '-table';
            $(id).attr('data-height', cntHeight);
            if(messageObj.message[key].data) {
              $(id).bootstrapTable('destroy');
              $(id).bootstrapTable(messageObj.message[key]);
            }
          });
        }
      });
    },
    sysUtilsFreeCount:function(event){
      EWD.sockets.sendMessage({
        type : 'sysUtilsFreeCount',
        params: {},
        done: function(messageObj) {
          if(messageObj.message.FreeBlock.data){
            $('#sysUtilsFreeCnt-table').bootstrapTable('destroy');
            $('#sysUtilsFreeCnt-table').bootstrapTable(messageObj.message.FreeBlock);
            var html = '<div class="pull-left titleHeader"><h4>%FREECNT</h4></div>';
            $('#FreeCntPageLoaded .fixed-table-toolbar').append(html);
            var html = 
              '<button id="sysUtilsFreeCntReloadBtn" class="btn btn-default"' + 
              '  type="button" name="FreeCntReloadReLoad" title="Free Count Reload">' +
              '  <i class="glyphicon glyphicon-refresh icon-refresh"></i>' +
              '</button>';
            $('#FreeCntPageLoaded .fixed-table-toolbar').children('.columns-right').append(html);
          }
        }
      });
    },
    sysUtilsAbout: function(event){
      EWD.sockets.sendMessage({
        type : 'sysUtilsAbout',
        params: {},
        done: function(messageObj) {
          // console.log('sysUtilsAbout = ',messageObj.message);
          var m = messageObj.message;
          var pieces = m.gtm.split(';');
          $('#buildVersion-iface').html(pieces[0]);
          $('#buildVersion-db').html(pieces[1]);
          $('#buildVersion-Node').html(m.nodeVersion);
          $('#buildVersion-ewdgateway2').html(m.build);
          $('#buildVersion-Ubuntu').html( m.platform + ' ' + m.release);
        }
      });
    },
    sysUtilsGtmEnv: function(event){
      EWD.sockets.sendMessage({
        type : 'sysUtilsGtmEnv',
        params: {},
        done: function(messageObj) {
          var env = messageObj.message;
          var html;
          $('#sysUtilsGtmEnv-table tbody').empty();
          $('#sysUtilsGtmRoutines-table tbody').empty();
          $.each(env, function(key, value) {
            // if (key.match(/^gtm|^GTM/)){
            if (key.match(/^gtm/)){
              if (key == 'gtmroutines') {
                var rsplit = value.split('(');
                var dirsObj = [];
                for(var i=1; i < rsplit.length; i++){
                    var idir = rsplit[i].split(')')[0].trim();      // routine Source Dir   ..[0]...)...[1]..
                    if(rsplit[i-1].indexOf(')')>0) {                // routine Object Dir
                      var obj = rsplit[i-1].split(')')[1].trim();
                    } else {
                      var obj = rsplit[i-1];
                    }
                    var lastOBJ = '';
                    if(obj.indexOf(' ')>0){                         // only Object Dir, no Source Dir
                      var objOBJ = obj.split(' ');
                      lastOBJ=objOBJ.pop()                          // last(pop) is Now routine Source > obj
                      for(var j=0; j < objOBJ.length ; j++ ){       // only Object Dir
                        dirsObj.push({obj:objOBJ[j], rtn:''});
                      }
                    } else {
                        lastOBJ = obj;
                    }
                    if(idir.indexOf(' ')>0){
                        var indirs = idir.split(' ');
                        for(var k=0; k < indirs.length; k++){
                            dirsObj.push({obj:lastOBJ, rtn:indirs[k].trim()});
                        }
                    }else{
                        dirsObj.push({obj:lastOBJ, rtn:idir});
                    }
                }
                for(var i=0; i< dirsObj.length; i++){
                  html = '';
                  html = html + '<tr class="table" id="sysUtilsGtmRoutines-table-row-' + (i+1) + '">';
                  html = html + '<td>' + (i+1) + '</td>';
                  html = html + '<td>' + dirsObj[i].obj + '</td>';
                  html = html + '<td>' + dirsObj[i].rtn + '</td>';
                  html = html + '</tr>';
                  $('#sysUtilsGtmRoutines-table tbody').append(html);
                }
              } else {
                html = '';
                html = html + '<tr class="table" id="sysUtilsGtmEnv-table-row-' + key + '">';
                html = html + '<td>' + key + '</td>';
                html = html + '<td>' + value + '</td>';
                html = html + '</tr>';
                $('#sysUtilsGtmEnv-table tbody').append(html);
              }
            }
          });
        }
      });
    },
    dseDumpFormatter: function(value, row){
      if(value.length>50) {
        var icon = '<i class="glyphicon glyphicon-star" data-toggle="tooltip" data-placement="bottom" title="' + value + '"></i>';
        value = value.substr(0,50) + ' .....' + icon;
      }
      return value;
    },
    dseDumpAll: function(event){
      var cntHeight = $("#dse_Container").height() - 150;
      $('#sysUtilsDseWarp-table').attr('data-height', cntHeight);
      EWD.sockets.sendMessage({
        type : 'dseWarp',
        params: {},
        done: function(messageObj) {
          if(messageObj.message.DseWrap){
            var columns = messageObj.message.DseWrap.columns;
            $.each(columns, function(key, colObj) {
              if (colObj.field != 'FIELD_NAME') {
                colObj['formatter'] = 'EWD.application.dseDumpFormatter';
                messageObj.message.DseWrap.columns[key] = colObj;
              } else {
                colObj['switchable'] = false;
                messageObj.message.DseWrap.columns[key] = colObj;
              }
            });
            $('#sysUtilsDseWarp-table').bootstrapTable('destroy');
            $('#sysUtilsDseWarp-table').bootstrapTable(messageObj.message.DseWrap);
            var html = '<div class="pull-left titleHeader"><h4>Database Structure Editor</h4></div>';
            $('#dsePageLoaded .fixed-table-toolbar').append(html);
            var html = 
              '<button id="dseDumpReloadBtn" class="btn btn-default"' + 
              '  type="button" name="DseReloadReLoad" title="Database Structure Reload">' +
              '  <i class="glyphicon glyphicon-refresh icon-refresh"></i>' +
              '</button>';
            $('#dsePageLoaded .fixed-table-toolbar').children('.columns-right').append(html);
          }
        }
      });
    },
    lkeShowAll: function(event){
      var cntHeight = $("#fin_Container").height() - 370;
      $('#lkeShowAll-table').attr('data-height', cntHeight);
      EWD.sockets.sendMessage({
        type : 'lkeShowAll',
        params: {},
        done: function(messageObj) {
          var result = "\n" + messageObj.message.result;
          $('#lkeResultPreArea').append(result);
          var preLength = $('#lkeResultPreArea').text().split('\n').length;
          if (preLength > (EWD.application.maxlkeResultPreAreaLength || 500)) {
            var text = $('#lkeResultPreArea').text();
            var arr = text.split('\n');
            var diff = preLength - EWD.application.maxlkeResultPreAreaLength;
            var arr2 = arr.splice(diff);
            text = arr2.join('\n');
            $('#lkeResultPreArea').text(text);
          }
          $('#lkeResultPreArea').animate({ scrollTop: $('#lkeResultPreArea')[0].scrollHeight}, 5);

          $('#lkeShowAll-table').bootstrapTable('destroy');
          // Event : When lke Show Table tbody cell Click, fire -> lkeModulOpen
          $('#lkeShowAll-table').bootstrapTable({ data : messageObj.message.lockArray })
            .on('click-cell.bs.table', function (element, row, value, field) {
              EWD.application.lkeModulOpen(element, row, value, field);
            });

          var html = '<div class="pull-left titleHeader"><h4>M Lock Utility (LKE)</h4></div>';
          $('#lkePageLoaded .fixed-table-toolbar').append(html);
          var html = 
            '<button id="lkeShowReloadBtn" class="btn btn-default"' + 
            '  type="button" name="lkeShowReload" title="LKE Reload">' +
            '  <i class="glyphicon glyphicon-refresh icon-refresh"></i>' +
            '</button>';
          $('#lkePageLoaded .fixed-table-toolbar').children('.columns-right').append(html);
          $("#lkeShowAllMessage-td-LOCKSPACEUS").html(messageObj.message.LOCKSPACEUS);
        }
      });
    },
    lkeClearExe: function(event){
      $('#lkeClearConfirmModal').modal('hide');
      if(EWD.application.lkeClearParams){
        EWD.sockets.sendMessage({
          type : 'lkeClear',
          params: EWD.application.lkeClearParams,
          done: function(messageObj) {
            console.log('lkeClear = ', messageObj.message);
            var result = messageObj.message.result;
            $('#lkeResultPreArea').append(result);
            var preLength = $('#lkeResultPreArea').text().split('\n').length;
            if (preLength > (EWD.application.maxlkeResultPreAreaLength || 500)) {
              var text = $('#lkeResultPreArea').text();
              var arr = text.split('\n');
              var diff = preLength - EWD.application.maxlkeResultPreAreaLength;
              var arr2 = arr.splice(diff);
              text = arr2.join('\n');
              $('#lkeResultPreArea').text(text);
            }
            $('#lkeResultPreArea').animate({ scrollTop: $('#lkeResultPreArea')[0].scrollHeight}, 5);

            EWD.application.lkeClearParams = {};
            EWD.application.lkeShowAll();
          }
        });
      }
    },
    lkeModulOpen: function(element, row, value, field){
      EWD.application.lkeClearParams = {};
      var question;
      if (row == 'Region') question = 'lke clear -REGION=' + value;
      if (row == 'PID') question = 'lke clear -PID=' + value;
      if (row == 'varName') question = 'lke clear -LOCK=""' + value + '""';
      $('#lkeClearConfirmQuestion').html('Do you Lock Clear?<br/>   > ' + question);
      EWD.application.lkeClearParams = { type: row, value: value };
      $('#lkeClearConfirmModal').modal({
          keyboard: true,
          backdrop: 'static'
      });
    },
    onStartup: function() {
        toastr.options.target = 'body';
        EWD.application.initFragment();
        EWD.bootstrap3.nav.enable();
        $('#loginModal').modal({
            keyboard: false,
            backdrop: 'static'
        });
        $('#loginPanelBody').keydown(function(event){
            if (event.keyCode === 13) {
                document.getElementById('btnLogin').click();
            }
        });
        $('body')
            .on('click','#btnLogin',EWD.application.Login)
            .on('click','#btnLogout',EWD.application.openLogOutModal)
            .on('click','#logoutConfirmPanelOKBtn',EWD.application.logOut)
            .on('click','#deleteConfirmPanelOKBtn',EWD.application.sessionDeleted)
            .on('click','#dseDumpReloadBtn',EWD.application.dseDumpAll)
            .on('click','#lkeShowReloadBtn',EWD.application.lkeShowAll)
            .on('click','#lkeClearConfirmOKBtn',EWD.application.lkeClearExe)
            .on('click','#sysUtilsFreeCntReloadBtn',EWD.application.sysUtilsFreeCount)
        ;
    },
    onPageSwap: {
    },
    onFragment: {
    },
    onMessage: {
      Login: function(messageObj){
        if(messageObj.message.error){
          toastr.error(messageObj.message.error);
        }else{
          if(messageObj.message.authenticated){
            $('#loginModal').modal('hide');
            EWD.application.username = messageObj.message.username;
            $('#gde_Container').show();
            // var mess = locale.tooltip.btnLogout ? locale.tooltip.btnLogout : ' user Logout (Ctrl+Q)';
            var mess = ' user Logout';
            $('#btnLogout').attr('title',EWD.application.username + mess);
            EWD.application.gdeShowAall();
            EWD.application.sysUtilsFreeCount();
            EWD.application.sysUtilsAbout();
            EWD.application.sysUtilsGtmEnv();
            EWD.application.dseDumpAll();
            EWD.application.lkeShowAll();
          }else{
            // var mess = locale.alert.Login ? locale.alert.Login : 'error!';
            var mess = 'error!';
            toastr.error(mess);
          }
        }
      },
      'EWD.session.deleted': function(messageObj){
          $('.bs-example-modal-sm').modal('hide');
          $('#deleteConfirmPanel').modal({
              keyboard: false,
              backdrop: 'static'
          });
      }
    }

};
