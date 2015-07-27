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

module.exports = {

  onMessage: {
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
                // build: '100 (15 May 2015)',
                build: ewdjsBuild(),
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
    // DSE wrap : invoking DSEWRAP^%zjdsGTMadm01
    sysUtilsDseWarp: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('DSEWRAP^%zjdsGTMadm01', ewd);
      return invoke.results;
    },
    // GDE Qualifier Data : invoking GDshowAll^%zjdsGTMadm01
    GDshowAll: function(params, ewd) {
      if (!ewd.session.isAuthenticated) return;
      ewd.query = params;
      var invoke = ewd.util.invokeWrapperFunction('GDshowAll^%zjdsGTMadm01', ewd);
      return invoke.results;
    }

  }

};
