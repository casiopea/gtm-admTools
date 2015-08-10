EWD.sockets.log = true;

EWD.application = {
    name: 'gtm-admTools',
    timeout: 3600,
    login: true,
    locale: 'ja-JP',                //  'en-US',
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
    regionList: {},
    regionSelect2: [],
    // globals: [],
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
        $('#ewd-navbar-title-other').text(EWD.application.labels['ewd-navbar-title-other']);
        $('#logoutConfirmPanel').modal('hide');
        $('#navList li').hide();
        $('#content .container').hide();
        $('#fin_Container').show();
    },
    sessionDeleted: function(event){
        event.preventDefault();
        $('#ewd-navbar-title-other').text(EWD.application.labels['ewd-navbar-title-other']);
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
                params: { file: 'html/gde/gde_' + key + 'Table.html', 
                          targetId: key + 'Content' }
              });
            });
        }
      });
      EWD.getFragment('html/mupip/mupip_Extract.html', 'mupipExtract_Container'); 
      EWD.getFragment('html/mupip/mupip_Load.html', 'mupipLoad_Container'); 
      EWD.getFragment('html/mupip/mupip_Integ.html', 'mupipInteg_Container'); 
      EWD.getFragment('html/mupip/mupip_Integ_Result.html', 'mupipIntegGlobalDetailModal'); 

      EWD.getFragment('html/lke/lke.html', 'lke_Container'); 
      EWD.getFragment('html/lke/lkeClearConfirm.html', 'lkeClearConfirmModal'); 

      EWD.getFragment('html/dse/dse.html', 'dse_Container'); 

      EWD.getFragment('html/sysUtils/sysUtils_FreeCntTable.html', 'FreeCnt_Container'); 
      EWD.getFragment('html/sysUtils/sysUtils_GtmEnvTable.html', 'GtmEnv_Container'); 

      EWD.getFragment('html/schedule/schedule.html', 'schedule_Container'); 

      EWD.getFragment('html/activity/fin.html', 'fin_Container'); 
      EWD.getFragment('html/activity/about.html', 'about_Container'); 
      EWD.getFragment('html/activity/login.html', 'loginModal');
      EWD.getFragment('html/activity/logout.html', 'logoutConfirmPanel');
      EWD.getFragment('html/activity/balus.html', 'deleteConfirmPanel');

      EWD.getFragment('html/mupip/mupip_Extract_GSELhelp.html', 'mupipExtractGSELhelpModal'); 
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
    gdeShowAall: function(){
      var cntHeight = $("#fin_Container").height() - 200;
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
    sysUtilsRegionList: function(){
      EWD.sockets.sendMessage({
        type : 'sysUtilsRegionList',
        params: {},
        done: function(messageObj) {
          EWD.application.regionList = messageObj.message.DSEregion;
          $.each(messageObj.message.DSEregion, function(key, obj) {
            EWD.application.regionSelect2.push( {id: key, text: obj} );
          });
            /*
            EWD.application.regionSelect2.push( {id: 0, text: 'DEFAULT'} );
            EWD.application.regionSelect2.push( {id: 1, text: 'MEGA'} );
            EWD.application.regionSelect2.push( {id: 2, text: 'TEMP'} );
            */  
        }
      });
    },
    sysUtilsFreeCount:function(){
      EWD.sockets.sendMessage({
        type : 'sysUtilsFreeCount',
        params: {},
        done: function(messageObj) {
          if(messageObj.message.FreeBlock.data){
            $('#sysUtilsFreeCnt-table').bootstrapTable('destroy');
            $('#sysUtilsFreeCnt-table').bootstrapTable(messageObj.message.FreeBlock);
            // var html = '<div class="pull-left titleHeader"><h4>%FREECNT</h4></div>';
            // $('#FreeCntPageLoaded .fixed-table-toolbar').append(html);
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
    sysUtilsAbout: function(){
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
      EWD.sockets.sendMessage({
        type: "EWD.startMonitor", message:  "start",
      });
    },
    sysUtilsGtmEnv: function(){
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
    dseDumpAll: function(){
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
            // var html = '<div class="pull-left titleHeader"><h4>Database Structure Editor</h4></div>';
            // $('#dsePageLoaded .fixed-table-toolbar').append(html);
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
    lkeShowAll: function(){
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
          // var html = '<div class="pull-left titleHeader"><h4>M Lock Utility (LKE)</h4></div>';
          // $('#lkePageLoaded .fixed-table-toolbar').append(html);
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
    lkeClearExe: function(){
      $('#lkeClearConfirmModal').modal('hide');
      if(EWD.application.lkeClearParams){
        EWD.sockets.sendMessage({
          type : 'lkeClear',
          params: EWD.application.lkeClearParams,
          done: function(messageObj) {
            // console.log('lkeClear = ', messageObj.message);
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
          keyboard: true,  backdrop: 'static'
      });
    },
    setGlobalsList: function(str){
      var cntHeight = $("#fin_Container").height() - 350;
      $('#mupipExtraGlobalSelector').height(cntHeight);
      $('#mupipExtraGlobalList').height(cntHeight - 100);
      var sendStr = [];
      if( str ){
        if(str.indexOf(',')>0) {
          var slist = str.split(',');
          for ( var i=0; i < slist.length ; i++ ){
            if (slist[i]) {
                if(slist[i].indexOf(':')>0){
                  var rngStr = slist[i].replace('*','').split(':');
                  rngStr[0] = rngStr[0].trim();
                  rngStr[1] = rngStr[1].trim();
                  if (!rngStr[1]) {
                    if (rngStr[0].match(/^\D/)) sendStr.push(rngStr[0].trim());
                  } else {
                    if (rngStr[0].match(/^\D/) && rngStr[1].match(/^\D/)) {
                      sendStr.push( rngStr[0] + ':' + rngStr[1] );
                    }
                  }
                } else {
                  slist[i] = slist[i].trim();
                  if (slist[i].match(/^\D/)) sendStr.push(slist[i]);
                }
            }
          }
        } else {
          if(str.indexOf(':')>0){
            var rngStr = str.split(':');
            rngStr[0] = rngStr[0].trim();
            rngStr[1] = rngStr[1].trim();
            if (!rngStr[1]) {
              if (rngStr[0].match(/^\D/)) sendStr.push(rngStr[0].trim());
            } else {
              if (rngStr[0].match(/^\D/) && rngStr[1].match(/^\D/)){
                sendStr.push( rngStr[0].trim() + ':' + rngStr[1].trim() );
              }
            }
          } else {
            if (str.match(/^\D/)) sendStr.push(str.trim());
          }
        }
      }
      str = sendStr ? sendStr.join(',') : '';
      $('#mupipExtraGlobalInput').val(str);
      if (!str) sendStr = ['*'];
      EWD.sockets.sendMessage({     // to call %ZG,  Do CALL^%GSEL
        type : 'GSELlist', 
        params: { GSEL : sendStr },
        done: function(messageObj) {
          $('#mupipExtraGlobalList').html('');
          if (messageObj.message.GSEL) {
            var glb = messageObj.message.GSEL;
            var html = '';
            for( var i=0; i<glb.length; i++ ){
              html += '<li class="list-group-item">' + glb[i] + '</li>';
            }
            $('#mupipExtraGlobalList').html(html);
          }
        }
      });
    },
    mupipExtractInit: function(){
      $('#mupipExtraRegionSelect').select2(
                        { multiple: true, data: EWD.application.regionSelect2 });
      $('#mupipExtraRegionSelect').select2("enable", false);
      EWD.application.setGlobalsList('');
      EWD.sockets.sendMessage({
        type : 'getHomeDir', params: {},
        done: function(messageObj) {
          $('#mupipExtraFileName').val(messageObj.message + '/1234.glo');
        }
      });
    },
    mupipExtraControl: function(value) {
      if( value == 'Region'){
        $('#mupipExtraGlobalSelector .form-gsel').hide();
        $('#mupipExtraRegionSelect').select2("enable", true);
        document.getElementById('mupipExtraRegionSelect').focus();
      }
      if( value == 'Select'){
        $('#mupipExtraGlobalSelector .form-gsel').show();
        $('#mupipExtraRegionSelect').select2("enable", false);
        document.getElementById('mupipExtraGlobalInput').focus();
      }
      if( value == 'All'){
        $('#mupipExtraGlobalSelector .form-gsel').hide();
        $('#mupipExtraRegionSelect').select2("enable", false);
        document.getElementById('mupipExtraFileName').focus();
      }
      if (value == 'reset') {
        $("#mupipExtraFileName").val('');
        $("#mupipExtraLabel").val('');
        $('input[name="mupipExtraFormat"]').val(['zwr']);
        $('input[name="mupipExtraOpe"]').val(['All']);
        $('#mupipExtraRegionSelect').select2('val',[]);
        $('#mupipExtraLogPreArea').text('');
      }



    },
    mupipLoadCheckChange: function(value, checked) {
      if(value == 'recnum') {
        if(checked){
          $('.mupipLoadBgnEnd').removeAttr("disabled");
        } else {
          $('.mupipLoadBgnEnd').attr('disabled', 'disabled');
        }
      }
      if(value == 'fillfacter') {
        if(checked){
          $('#mupipLoadFillFactor').removeAttr("disabled");
        } else {
          $('#mupipLoadFillFactor').attr('disabled', 'disabled');
        }
      }
    },
    mupipLoadInit: function(){
      var cntHeight = $("#fin_Container").height() - 350;
      $('#mupipLoadLoadedHeader').height(cntHeight);
      $('#mupipLoadedGlobalList').height(cntHeight - 100);
    },
    mupipIntegInit: function () {
      var cntHeight = $("#fin_Container").height() - 400;
      $('#mupipIntegGlobalList').height(cntHeight - 120);
      $('#mupipIntegRegionSelect').select2(
                    { multiple: true, data: EWD.application.regionSelect2 });
      EWD.application.mupipIntegControl('reset');
    },
    mupipIntegControl: function(value) {
      if (value == 'file') {
        $('#mupipIntegRegionSelectForm').hide();
        $('#mupipIntegTargetFileNameForm').show();
        document.getElementById('mupipIntegTargetFileName').focus();
      }
      if (value == 'region') {
        $('#mupipIntegRegionSelectForm').show();
        $('#mupipIntegTargetFileNameForm').hide();
      }
      if (value == 'reset') {
        $('input[name="mupipIntegReport"]').val(['brief']);
        $("#mupipIntegTargetFileName").val('');
        $('#mupipIntegRegionSelect').select2('val',[]);
        $('#mupipIntegGlobalList').html('');
        $('#mupipIntegSummaryList').html('');
        $('#mupipIntegLogPreArea').text('');
        $("#mupipIntegTarget-file").click();
      }
      if (value == 'stop') {
        $('#mupipIntegStopBtn').attr('disabled', 'disabled');
        $('#mupipIntegResetBtn').removeAttr("disabled");
        $('#mupipIntegStartBtn').removeAttr("disabled");
      }
      if (value == 'start') {
        $('#mupipIntegLogPreArea').text('');
        $('#mupipIntegStopBtn').removeAttr("disabled");
        $('#mupipIntegStartBtn').attr('disabled', 'disabled');
        $('#mupipIntegResetBtn').attr('disabled', 'disabled');
      }
    },
    mupipIntegDetailGlobal: function(glb, detail){
      EWD.sockets.sendMessage({
        type : 'mupipIntegDetailGlobal',
        params : { global : glb, detail : detail },
        done: function(messageObj) {
          var data = messageObj.message.data;
          if(detail == 'Global'){
            var title = 'Global variable  ^' + glb;
          } else {
            var title = glb;
            if (title.match(/integ.$/)){
              var columns = [{ title: 'Type', align: 'center' }];
            }
          }
          $('#mupipIntegGlobalResult-table').bootstrapTable('destroy');
          $('#mupipIntegGlobalResult-table').bootstrapTable({data: data, columns: columns });
          $('#mupipIntegResultPanelHeading').text(title);
          $('#mupipIntegGlobalDetailModal').modal({
              keyboard: false,
              backdrop: 'static'
          });
          document.getElementById('mupipIntegResultCancelBtn').focus();
        }
      });
    },
    mupipIntegExit: function(code){
      if(code == 0) {
        toastr.success('MUPIP INTEG  process completes');
      } else {
        toastr.warning('Stop MUPIP INTEG code :' + code);
      }
      EWD.application.mupipIntegControl('stop');
      if(code == 0) {
        EWD.sockets.sendMessage({
          type : 'mupipIntegResultList', params : {},
          done: function(messageObj) {
            $('#mupipIntegGlobalList').html('');
            $('#mupipIntegSummaryList').html('');
            if (messageObj.message.GSEL) {
              var glb = messageObj.message.GSEL;
              var html = '';
              for( var i=0; i<glb.length; i++ ){
                html += '<li class="list-group-item">' + 
                        '<a href="#">' + glb[i] +
                        '</a></li>';
              }
              $('#mupipIntegGlobalList').html(html);
            }
            if (messageObj.message.Summary) {
              var summary = messageObj.message.Summary;
              var html = '';
              for( var i=0; i<summary.length; i++ ){
                html += '<li class="list-group-item">' + 
                        '<a href="#">' + summary[i] +
                        '</a></li>';
              }
              $('#mupipIntegSummaryList').html(html);
            }
          }
        });
      } else {
        $('#mupipIntegGlobalList').html('');
        $('#mupipIntegSummaryList').html('');
      }
    },
    mupipIntegForceStop: function(){
        EWD.sockets.sendMessage({type: 'mupipIntegForceStop', params: {} });
    },
    mupipIntegSpawn: function(){
      var error,fileName,targetVal,params;
      var report = $('input[name="mupipIntegReport"]:checked').val();
      var target = $('input[name="mupipIntegTarget"]:checked').val();
      if(target == 'file'){
        var fileName = $('#mupipIntegTargetFileName').val();
        if(!fileName) {
          error = 'Bad File Name!';
          toastr.error(error);
          return;
        } else {
          targetVal = fileName.trim();
        }
      } else {
        var region = $('#mupipIntegRegionSelect').select2('data');
        if(!region.length){
          error = 'Select Region Name!';
          toastr.error(error);
          return;
        } else {
          var c = '',targetVal='';
          for(i=0;i<region.length;i++) {
            targetVal = targetVal + c + region[i].text.trim();
            c = ',';
          }
        }
      }
      EWD.application.mupipIntegControl('start');
      toastr.warning('DB integrity Start ...');
      EWD.sockets.sendMessage({
        type : 'mupipIntegSpawn',
        params : {  target : target, 
                    report : report, 
                    targetVal: targetVal }
      });
    },

    onStartup: function() {
        toastr.options.target = 'body';
        // EWD.application.htmlDirList();
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
            .on('click','#dseDumpReloadBtn', function(event) {
                  event.preventDefault();
                  EWD.application.dseDumpAll();
                })
            .on('click','#lkeShowReloadBtn', function(event) {
                  event.preventDefault();
                  EWD.application.lkeShowAll();
                })
            .on('click','#lkeClearConfirmOKBtn', function(event) {
                  event.preventDefault();
                  EWD.application.lkeClearExe();
                })
            .on('click','#sysUtilsFreeCntReloadBtn', function(event) {
                  event.preventDefault();
                  EWD.application.sysUtilsFreeCount();
                })
            .on('click','input[name="mupipExtraOpe"]', function(event){
                  EWD.application.mupipExtraControl($(this).val());
                })
            .on('click','#mupipExtraGlobalSubmit', function(event){
                  event.preventDefault();
                  document.getElementById('mupipExtraGlobalInput').focus();
                  EWD.application.setGlobalsList($('#mupipExtraGlobalInput').val());
                })
            .on('click','#mupipExtraGlobalReloadBtn', function(event){
                  event.preventDefault();
                  $('#mupipExtraGlobalInput').val('');
                  document.getElementById('mupipExtraGlobalInput').focus();
                  EWD.application.setGlobalsList('');
                })
            .on('click','#mupipExtraGlobalQABtn', function(event){
                  event.preventDefault();
                  $('#mupipExtractGSELhelpModal').modal({
                      keyboard: true,  backdrop: 'static'
                  });
                })
            .on('click','#mupipExtraResetBtn', function (event) {
                  event.preventDefault();
                  EWD.application.mupipExtraControl('reset');
                })
            .on('click','#mupipExtraStopBtn', function (event) {
                  event.preventDefault();

                })
            .on('click','#mupipExtraStartBtn', function (event) {
                  event.preventDefault();


                })
            .on('click','#mupipLoadPageLoaded input[type="checkbox"]', function(event){
                  EWD.application.mupipLoadCheckChange($(this).val(), $(this).prop('checked'));
                })
            .on('click','input[name="mupipIntegTarget"]', function(event){
                  EWD.application.mupipIntegControl($(this).val());
                })
            .on('click','#mupipIntegResetBtn', function(event) {
                  event.preventDefault();
                  EWD.application.mupipIntegControl('reset');
                })
            .on('click','#mupipIntegStopBtn', function(event) {
                  event.preventDefault();
                  EWD.application.mupipIntegForceStop();
                })
            .on('click','#mupipIntegStartBtn', function(event) {
                  event.preventDefault();
                  EWD.application.mupipIntegSpawn();
                })
            .on('click','#mupipIntegGlobalList li a', function(event) {
                  event.preventDefault();
                  EWD.application.mupipIntegDetailGlobal($(this).text(), 'Global');
                })
            .on('click','#mupipIntegSummaryList li a', function(event) {
                  event.preventDefault();
                  EWD.application.mupipIntegDetailGlobal($(this).text(), 'Summary');
                })
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
            EWD.application.username = messageObj.message.username;
            // var mess = locale.tooltip.btnLogout ? locale.tooltip.btnLogout : ' user Logout (Ctrl+Q)';
            var mess = ' user Logout';
            $('#btnLogout').attr('title',EWD.application.username + mess);
            EWD.application.sysUtilsRegionList();
            EWD.application.gdeShowAall();
            EWD.application.sysUtilsAbout();
            EWD.application.sysUtilsGtmEnv();
            EWD.application.mupipExtractInit();
            EWD.application.mupipLoadInit();
            EWD.application.mupipIntegInit();
            EWD.application.sysUtilsFreeCount();
            EWD.application.dseDumpAll();
            EWD.application.lkeShowAll();
            $('#gde_Container').show();
            $('#loginModal').modal('hide');
          }else{
            // var mess = locale.alert.Login ? locale.alert.Login : 'error!';
            var mess = 'error!';
            toastr.error(mess);
          }
        }
      },
      mupipIntegSpawnMessage: function(messageObj){
        if(messageObj.message.type == 'data') {
          $('#mupipIntegLogPreArea').append(messageObj.message.retrieve);
          $('#mupipIntegLogPreArea').animate({ scrollTop: $('#mupipIntegLogPreArea')[0].scrollHeight}, 5);
        }
        if(messageObj.message.type == 'exit') {
            EWD.application.mupipIntegExit(messageObj.message.retrieve);
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
