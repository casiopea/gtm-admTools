/*
  gtm-admTools.js GT.M Administration mini Tools collection for EWD.js
  2015/07/23 13:12
  
  Written by Kiyoshi Sawada <casiopea.tpine@gmail.com>
  Copyright c 2015 Japan DynaSystems Inc.
 
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License (AGPL)
  as published by the Free Software Foundation, either version 3 of
  the License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public 
  License along with this program. 
 If not, see http://www.gnu.org/licenses/.
*/

var i18n = {
    username: 'You must enter your username.',
    password: 'Missing or invalid password',
    invaliduser: 'Invalid login attempt',
    pathtoget: 'Invalid path to get routine.',
    pathnotgiven: 'Routine Path not given.',
    pathtosave: 'Invalid path to save routine.',
    pathtobuild: 'Invalid path to build routine.',
    alreadyexists: 'Routine with this name already exists.',
    routinename: 'Invalid Routine Name.',
    loginType: 'invalid loginType! Please contact system administrator.'
};
var fs = require('fs');
var path = require('path');
var fork = require('child_process').fork;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var crypto = require("crypto");
var os = require('os');
var password = {
  encrypt: function(password) {
    if (!password || password === '') return {error: i18n.password ? i18n.password : 'Missing or invalid password' };
    // if (!password || password === '') return {error: 'Missing or invalid password'};
    var salt = crypto.randomBytes(64);
    var iterations = 10000;
    var keyLength = 64;
    var encrypted = crypto.pbkdf2Sync(password, salt, iterations, keyLength);
    return {
      type: 'password',
      hash: encrypted.toString('base64'),
      salt: salt.toString('base64')
    };
  },
  matches: function(fromUser, credentials) {
    var iterations = 10000;
    var keyLength = 64;
    var salt = new Buffer(credentials.salt, 'base64');
    var encrypted = crypto.pbkdf2Sync(fromUser, salt, iterations, keyLength);
    encrypted = encrypted.toString('base64');
    if (credentials.hash === encrypted) return true;
    return false;
  }
};
var htmlFileList = [];
var htmlDirWalk = function(p, callback){
  var results = [];
  fs.readdir(p, function (err, files) {
    if (err) throw err;
 
    var pending = files.length; 
    if (!pending) return callback(null, results); 
    
    files.map(function (file) { 
      return path.join(p, file);
    }).filter(function (file) {
      if(fs.statSync(file).isDirectory()) htmlDirWalk(file, function(err, res) { 
        results.push({name:path.basename(file), children:res});
        if (!--pending) callback(null, results);
       });
      return fs.statSync(file).isFile();
    }).forEach(function (file) {   // save file name
      var stat = fs.statSync(file);
      results.push({file:path.basename(file), size:stat.size});
      htmlFileList.push(file); 
      if (!--pending) callback(null, results);
    });
    
  });
};
var initLoginType = function(loginType, ewd){
    if (loginType == 'ewdMonitor') {
        var loginMon = new ewd.mumps.GlobalNode('zewdMonitor', ['login']);
        return loginMon._exists
    } else {
        var loginMedo = new ewd.mumps.GlobalNode('zewdMedo', ['login', 'medo']);
        if (loginMedo._exists) {
            return true;
        } else {
            loginMedo._setDocument(password.encrypt('gtmuser'));
            return true;
        }
    }
    return false;
};
var ewdjsBuild = function(){
  var buffer = new Buffer(3000);
  var path = './node_modules/ewdjs/lib/ewd.js';
  var fd = fs.openSync(path, 'r');
  fs.readSync(fd, buffer, 0, 2999);
  fs.closeSync(fd);
  var line = buffer.toString('utf8').split(/\n/);
  for (var i = 0; i <= line.length - 10; i++) {
    if (line[i].trim().match(/^buildNo/)) buildNo = line[i].trim();
    if (line[i].trim().match(/^buildDate/)) buildDate = line[i].trim();
  }
  return 'EWD.js build ' + buildNo.split(':')[1].trim() + buildDate.split("'")[1];
};
var lkeShowAll = function(params, ewd, regions){
    var command = process.env.gtm_dist + "/lke show -all";
    var child = exec(command,
        function (error, stdout, stderr){
            if(stdout.toString()){
                console.log('*******************************');
                console.log('stdout = ',stdout.toString());
                console.log('*******************************');
            }
            if(stderr.toString()){
                var line = stderr.toString().split('\n');
                var lkSp = '';
                var reg = '';
                var inPid;
                var rArr = [];
                var pid = 0;
                var varName = '';
                var contFlg = false;
                for(var i=0; i < line.length; i++){
                  if (line[i] == '') continue;
                  if (regions.indexOf(line[i]) > -1) {
                    reg = line[i];
                    continue;
                  }
                  if (line[i].match(/^\%GTM-I-LOCKSPACEUSE/)) {
                    lkSp = line[i].split(',')[1].trim();
                    continue;
                  }

                  if (contFlg) {
                    if (line[i].match(/^\s*Owned/)) {
                      pid = line[i].split("Owned by PID=")[1].trim().split(/\s/)[0].trim();
                      contFlg = false;
                    }
                  } else {
                    inPid = line[i].split("Owned by PID=");
                    if ( typeof inPid[1] != 'undefined' ) {
                      varName = line[i].split("Owned by PID=")[0].trim();
                      pid = line[i].split("Owned by PID=")[1].trim().split(/\s/)[0].trim();
                    } else {
                      varName = line[i].trim();
                      contFlg = true;
                    }
                  }
                  if (!contFlg){
                    rArr.push({
                                Region: reg,
                                PID: pid,
                                varName: varName
                              });
                  }
                }
                ewd.sendWebSocketMsg({
                    type: 'lkeShowAll',
                    message: 
                        {
                            status: 'stderr',
                            result: stderr.toString(),
                            lockArray: rArr,
                            LOCKSPACEUS: lkSp
                        }
                });
            }
            if(error){
                console.log('*******************************');
                console.log('error = ',error);
                console.log('*******************************');
            }
        });
};
var lkeClearExe = function(params, ewd) {
    var command = '';
    var value = params.value.trim();
    if (params.type == 'Region')  command = 'lke clear -REGION=' + value + ' -NOINTERACTIVE';
    if (params.type == 'PID')     command = 'lke clear -PID=' + value + ' -NOINTERACTIVE';
    if (params.type == 'varName') command = "lke clear -LOCK='" + value + "' -NOINTERACTIVE" ;
    var child = exec(process.env.gtm_dist + '/' + command ,
        function (error, stdout, stderr){
            if(stdout.toString()){
                console.log('*******************************');
                console.log('stdout = ',stdout.toString());
                console.log('*******************************');
            }
            if(stderr.toString()){
                console.log('stderr = ',stderr.toString());
                ewd.sendWebSocketMsg({
                    type: 'lkeClear',
                    message: 
                        {
                            status: 'stderr',
                            result: stderr.toString(),
                        }
                });
              }
            if(error){
                console.log('*******************************');
                console.log('error = ',error);
                console.log('*******************************');
            }
        });
};
var resText = '';
var integ = new Object();
var mupipIntegSpawn = function(params, ewd) {

  var gRes = new ewd.mumps.GlobalNode(
      '%zewdSession',
      ['session', ewd.session.sessid, 'ewd_gtmAdmTools', 'INTEG', 'result']);
  gRes._delete();
  resText = '';

  var report = '-' + params.report;
  var target = '-' + params.target + ' ' + params.targetVal;
  var command = 'mupip integ ' + report + ' ' + target;
  // console.log('****** MUPIP INTEG = ' + command);
  integ = spawn( 'mupip',  [ 'integ', report, target ] );
  integ.stderr.on('data', function (data) {
    resText += data.toString('utf8');
    ewd.sendWebSocketMsg({
        type: 'mupipIntegSpawnMessage',
        message: { type: 'data', retrieve: data.toString('utf8') }
    });
  });
  integ.on('exit', function (code) {
    ewd.sendWebSocketMsg({
      type: 'mupipIntegSpawnMessage',
      message: { type: 'exit', retrieve: code }
    });
    if (code == 0) {
      var line = [];
      var buf = resText.split('\n');
      for(var i=0; i<buf.length; i++){
        if (buf[i] == '') continue;
        line.push(buf[i].trim());
      }
      var label = '_';
      var global = '';
      for(var i=0; i < line.length; i++){
        label = '';
        if (line[i].match(/^Directory tree|^Global variable/)) {
          label = line[i];
          for(var k=0; k < 2 ; k++ ){
            var spl = line[i+k+2].split(/\s+/);
            var data = {
                Level:  spl[0],  Blocks:   spl[1],   Records:  spl[2],  
                Used:   spl[3],  Adjacent: spl[4]
            };
            if (label == 'Directory tree' ) {
              gRes.$('Summary').$(label).$('data').$(k)._setDocument(data);
            } else {
              global = label.split(/\s+/)[2].replace('^','');
              gRes.$('Global').$(global).$('data').$(k)._setDocument(data);
            }
          }
        }
        if (line[i].match(/integ.$/)) {
          label = line[i];
          for(var k=0; k < 5 ; k++ ){
            var spl = line[i+k+2].split(/\s+/);
            gRes.$('Summary').$(label).$('data').$(k)._setDocument({
                Level:   spl[0],  Blocks:   spl[1],   Records:  spl[2],
                Used:   spl[3],  Adjacent: spl[4]    });
          }
        }
      }
    }
  });
  integ.on('error', function(err) {
    console.log('****** MUPIP INTEG error = ' + err);
    ewd.sendWebSocketMsg({
      type: 'mupipIntegSpawnMessage', message: {type: 'error', retrieve: err} 
    });
  });
};
var mupipIntegForceStop = function(params, ewd) {
  var command = process.env.gtm_dist + "/mupip stop " + integ.pid ;
  var child = exec(command,
      function (error, stdout, stderr){
        if(stdout.toString()){
          console.log('**** mupipIntegForceStop= ',stdout.toString());
        }
        if(stderr.toString()){
          console.log('**** mupipIntegForceStop= ',stderr.toString());
          /*
          ewd.sendWebSocketMsg({
               type: 'mupipIntegSpawnMessage',
               message: 
                  {
                      exec: false,
                      routineName : routineName,
                      stderr: "GT.M MUPIP forced STOP\n" + stderr.toString()
                  }
          });
          */
        }
      });
};
var mupipIntegResultList = function(params, ewd){
  var res = [], sum = [];
  var gRes = new ewd.mumps.GlobalNode( '%zewdSession',
      ['session', ewd.session.sessid, 'ewd_gtmAdmTools', 'INTEG', 'result']);
  gRes.$('Global')._forEach(function(node, sub){ res.push(node); });
  gRes.$('Summary')._forEach(function(node, sub){ sum.push(node); });
  return { result : 'ok', GSEL: res, Summary: sum };
};
var mupipIntegDetailGlobal = function(params, ewd){
  var global = params.global;
  var detail = params.detail;
  var gRes = new ewd.mumps.GlobalNode( '%zewdSession',
      ['session', ewd.session.sessid, 'ewd_gtmAdmTools', 'INTEG', 'result']);
  var data = gRes.$(detail).$(global).$('data')._getDocument();
  return { result : 'ok', data: data };
};

module.exports = {

  onMessage: {
    mupipIntegDetailGlobal: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      return mupipIntegDetailGlobal(params, ewd);
    },
    mupipIntegResultList: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      return mupipIntegResultList(params, ewd);
    },
    // MUPIP Integ Spawn :  call to $gtm_dist/mupip integ -.....
    mupipIntegSpawn: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      mupipIntegSpawn(params, ewd);
    },
    // MUPIP Integ Force Stop by MUPIP STOP : call to $gtm_dist/mupip stop pid
    mupipIntegForceStop: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      mupipIntegForceStop(params, ewd);
    },
    getHomeDir: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      return process.env.HOME;
    },
    GSELlist: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('GSELlist^%zjdsGTMadm01', ewd);
      return { result : 'ok', GSEL: invoke.results.GSEL };
    },
    getGlobals: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      var gloArray = ewd.mumps.getGlobalDirectory();
      return gloArray;
    },
    // Lock Utility lke show all
    lkeShowAll: function(params,ewd) {
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('DSEregion^%zjdsGTMadm01', ewd);
      lkeShowAll(params, ewd, invoke.results.DSEregion);
    },
    // Lock Utility lke clear
    lkeClear: function(params,ewd) {
      if (!ewd.session.isAuthenticated) return;
      lkeClearExe(params, ewd);
    },
    // process environment
    sysUtilsGtmEnv: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      return process.env;
    },
    // about this Sysytem information
    sysUtilsAbout: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      return {
                nodeVersion: process.version ,
                build: '100 (15 May 2015)',
                // build: ewdjsBuild(),
                gtm: ewd.mumps.version(),
                platform: os.platform(),
                release: os.release()
              };
    },
    // %FREECNT: number of free blocks in the database files
    sysUtilsFreeCount:function(params,ewd){
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('FreeBlock^%zjdsGTMadm01', ewd);
      return invoke.results;
    },
    // Get Region List 
    sysUtilsRegionList: function(params, ewd){
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('DSEregion^%zjdsGTMadm01', ewd);
      return invoke.results;
    },
    // DSE wrap for BootStrap-Table.wenzhixin format  : invoking DSEWRAP2^%zjdsGTMadm01
    dseWarp: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('DSEWRAP2^%zjdsGTMadm01', ewd);
      return invoke.results;
    },
    // GDE Qualifier Data : invoking GDshowAll^%zjdsGTMadm01
    GDshowAll: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('GDshowAll^%zjdsGTMadm01', ewd);
      return invoke.results;
    },
    // gtm-admTools/html  get file-List
    htmlDirList: function(params, ewd){
      var dir = params.dir;
      htmlDirWalk(dir, function(err, results) {
        if (err) throw err;
        ewd.sendWebSocketMsg({ type: 'htmlDirList', list: htmlFileList });
      });
    },
    // Login user name and password Check, ewd.session.isAuthenticated = true
    Login: function(params,ewd){
        var loginType = params.loginType;
        if ( !initLoginType(loginType, ewd) ) {      //  loginType must be 'medo' or 'ewdMonitor'
            return {
                error: i18n.loginType ? i18n.loginType : 'invalid loginType! Please contact system administrator.' ,
                authenticated: false
            };
        }
        if (params.username === '') {
            return {
                error: i18n.username ? i18n.username : 'You must enter your username.' ,
                authenticated: false
            };
        }
        if (params.password === '') {
            return {
                error: i18n.password ? i18n.password : 'Missing or invalid password' ,
                authenticated: false
            };
        }
        var glv = (loginType == 'ewdMonitor') ? 'zewdMonitor' : 'zewdMedo';
        var loginGlo = new ewd.mumps.GlobalNode(glv, ['login']);
        if (loginGlo._exists) { 
            var userGlo = loginGlo.$(params.username);
            if (!userGlo._exists){
                return {
                    error: i18n.invaliduser ? i18n.invaliduser : 'Invalid login attempt' ,
                    authenticated: false
                };
            } 
            var credentials = userGlo._getDocument();
            if ( credentials.type === 'password' &&
                 !password.matches(params.password, credentials)) {
                    return {
                        error: i18n.password ? i18n.password : 'Invalid Password.' ,
                        authenticated: false
                    };
            }
        } else {
            return {
                error: i18n.loginType ? i18n.loginType : 'invalid loginType! Please contact system administrator.' ,
                authenticated: false
            };
        }

        ewd.session.setAuthenticated();
        medoUser = params.username;
        return {
            error: '',
            username : params.username,
            authenticated: true
        };
    }
  }

};
