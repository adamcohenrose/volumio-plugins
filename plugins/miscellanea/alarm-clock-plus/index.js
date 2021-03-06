'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var schedule = require('node-schedule');
var moment = require('moment');
var config = new (require('v-conf'))();

// Define the AlarmClock class
module.exports = AlarmClock;

function AlarmClock (context) {
  var self = this;

  // Save a reference to the parent commandRouter
  self.context = context;
  self.commandRouter = self.context.coreCommand;

  self.logger = self.context.logger;
  self.jobs = [];
  self.sleep = {
    sleep_enabled: false,
    sleep_hour: 7,
    sleep_minute: 0
  };
}

AlarmClock.prototype.getConfigurationFiles = function () {
  var self = this;

  return ['config.json'];
};

AlarmClock.prototype.onVolumioStart = function () {
  var self = this;
  // Perform startup tasks here
  self.configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
  config.loadFile(self.configFile);
  self.applyConf(self.getConf());

  return libQ.resolve();
};

AlarmClock.prototype.onStop = function () {
  var self = this;
  // Perform startup tasks here
};

AlarmClock.prototype.onRestart = function () {
  var self = this;
  // Perform startup tasks here
};

AlarmClock.prototype.onInstall = function () {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.onUninstall = function () {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.getUIConfig = function () {
  var self = this;

  var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

  // enable
  uiconf.sections[0].content[0].value = config.get('enabled');

  // shuffle
  uiconf.sections[0].content[1].value = config.get('shuffle');

  // hour
  uiconf.sections[0].content[2].value.value = config.get('hour');

  // minute
  uiconf.sections[0].content[3].value.value = config.get('minute');

  //monday
  uiconf.sections[0].content[4].value.value=config.get('monday');

  //tuesday
  uiconf.sections[0].content[5].value.value=config.get('tuesday');

  //wednesday
  uiconf.sections[0].content[6].value.value=config.get('wednesday');

  //thursday
  uiconf.sections[0].content[7].value.value=config.get('thursday');

  //friday
  uiconf.sections[0].content[8].value.value=config.get('friday');

  //saturday
  uiconf.sections[0].content[9].value.value=config.get('saturday');

  //sunday
  uiconf.sections[0].content[10].value.value=config.get('sunday');

  return uiconf;
};

AlarmClock.prototype.setUIConfig = function (data) {
  var self = this;

  var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');
};

AlarmClock.prototype.getConf = function () {
  var self = this;
  var conf = [];
  try {
    var conf = JSON.parse(fs.readJsonSync(self.configFile));
  } catch (e) {}

  return conf;
};

AlarmClock.prototype.fireAlarm = function (alarm) {
  var self = this;

  self.logger.info('Starting Scheduled Playlist ' + alarm.playlist);
  if (alarm.shuffle) {
    self.commandRouter.setRandom({"value": true})
  }
  self.commandRouter.playPlaylist(alarm.playlist);
};

AlarmClock.prototype.clearJobs = function () {
  var self = this;
  for (var i in self.jobs) {
    var job = self.jobs[i];
    self.logger.info('Alarm: Cancelling ' + job.name);
    job.cancel();
  }
  self.jobs = [];
};

AlarmClock.prototype.applyConf = function (conf) {
  var self = this;

  for (var i in conf) {
    var item = conf[i];
    var d = new Date(item.time);
    var n = d.getHours();

    var schedule = require('node-schedule');
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = [];
    if (item.monday) {
      rule.dayOfWeek.push(1);
    }
    if (item.tuesday) {
      rule.dayOfWeek.push(2);
    }
    if (item.wednesday) {
      rule.dayOfWeek.push(3);
    }
    if (item.thursday) {
      rule.dayOfWeek.push(4);
    }
    if (item.friday) {
      rule.dayOfWeek.push(5);
    }
    if (item.saturday) {
      rule.dayOfWeek.push(6);
    }
    if (item.sunday) {
      rule.dayOfWeek.push(7);
    }
    rule.minute = d.getMinutes();
    rule.hour = d.getHours();
    let currentItem = Object.assign({}, item);

    if (item.enabled) {
      self.jobs[i] = schedule.scheduleJob(rule, function () {
            	self.fireAlarm(currentItem);
      });
      self.logger.info('Alarm: Scheduling Playlist ' + item.playlist + ' at ' + rule.hour + ':' + rule.minute);
    }
  }
};

AlarmClock.prototype.setConf = function (conf) {
  var self = this;
  self.clearJobs();
  self.applyConf(conf);
  for (var i in conf) {
    var item = conf[i];
    item.id = i;
  }
  fs.writeJsonSync(self.configFile, JSON.stringify(conf));
};

// Optional functions exposed for making development easier and more clear
AlarmClock.prototype.getSystemConf = function (pluginName, varName) {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.setSystemConf = function (pluginName, varName) {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.getAdditionalConf = function () {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.setAdditionalConf = function () {
  var self = this;
  // Perform your installation tasks here
};

AlarmClock.prototype.getAlarms = function () {
  var self = this;

  var defer = libQ.defer();
  var alarms;

  try {
    alarms = self.getConf();
  } catch (e) {

  }
  if (alarms == undefined) {
    alarms = [];
  }
  // TODO GET ALARM
  defer.resolve(alarms);
  return defer.promise;
};

AlarmClock.prototype.saveAlarm = function (data) {
  var self = this;
  var defer = libQ.defer();

  for (var i in data) {
    if (!data[i].time) {
      var error = true;
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('ALARM_PLUS.ALARM_CLOCK_TITLE'), self.commandRouter.getI18nString('ALARM_PLUS.TIME_SELECT_ERROR'));
    } else if (!data[i].playlist) {
      var error = true;
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('ALARM_PLUS.ALARM_CLOCK_TITLE'), self.commandRouter.getI18nString('ALARM_PLUS.PLAYLIST_SELECT_ERROR'));
    } else if (!data[i].monday && !data[i].tuesday && !data[i].wednesday && !data[i].thursday && !data[i].friday && !data[i].saturday && !data[i].sunday) {
      var error = true;
      self.commandRouter.pushToastMessage('error', self.commandRouter.getI18nString('ALARM_PLUS.ALARM_CLOCK_TITLE'), self.commandRouter.getI18nString('ALARM_PLUS.DAY_SELECT_ERROR'));
    }
  }

  if (!error) {
    self.setConf(data);
    self.commandRouter.pushToastMessage('success', self.commandRouter.getI18nString('ALARM_PLUS.ALARM_CLOCK_TITLE'), self.commandRouter.getI18nString('ALARM_PLUS.ALARM_CLOCK_SAVE'));
  }

  defer.resolve({});
  return defer.promise;
};

AlarmClock.prototype.getSleep = function () {
  var self = this;
  var defer = libQ.defer();
  var sleepTask = self.getSleepConf();
  var sleep_hour = sleepTask.sleep_hour;
  var sleep_minute = sleepTask.sleep_minute;
  if (sleepTask.sleep_action) {
    var sleep_action = sleepTask.sleep_action;
    if (sleepTask.sleep_action == 'stop') {
      var sleep_actionText = self.commandRouter.getI18nString('ALARM_PLUS.STOP_MUSIC');
    } else if (sleepTask.sleep_action == 'poweroff') {
      var sleep_actionText = self.commandRouter.getI18nString('ALARM_PLUS.TURN_OFF');
    }
  } else {
    var sleep_action = 'stop';
    var sleep_actionText = self.commandRouter.getI18nString('ALARM_PLUS.STOP_MUSIC');
  }
  var when = new Date(sleepTask.sleep_requestedat);
  var now = moment(new Date());

  var thisMoment = moment(when);
  thisMoment.add(sleep_hour, 'h');
  thisMoment.add(sleep_minute, 'm');
  var diff = moment.duration(thisMoment.diff(now));

  // only return actual time if sleep timer is active
  if (self.sleep.sleep_enabled == true) {
    sleep_hour = diff.get('hours');
    sleep_minute = diff.get('minutes');
  } else {
    sleep_hour = 0;
    sleep_minute = 0;
  }

  defer.resolve({
    enabled: sleepTask.sleep_enabled,
    time: sleep_hour + ':' + sleep_minute,
    action: {val: sleep_action, text: sleep_actionText}
  });
  return defer.promise;
};

AlarmClock.prototype.setSleepConf = function (conf) {
  var self = this;
  self.sleep = conf;
};

AlarmClock.prototype.getSleepConf = function () {
  var self = this;
  return self.sleep;
};

AlarmClock.prototype.setSleep = function (data) {
  var self = this;
  var defer = libQ.defer();

  var splitted = data.time.split(':');

  var thisMoment = moment();

  var addedHours = parseFloat(splitted[0]);
  var addedMinutes = parseFloat(splitted[1]);

  thisMoment.add(parseFloat(splitted[0]), 'h');
  thisMoment.add(parseFloat(splitted[1]), 'm');

  	var sleephour = thisMoment.hour();
  var sleepminute = thisMoment.minute();
  var sleepTask = {
    sleep_enabled: data.enabled,
    sleep_hour: splitted[0],
    sleep_minute: splitted[1],
    sleep_requestedat: new Date().toISOString(),
    sleep_action: data.action
  };
  self.setSleepConf(sleepTask);

  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'SetSleep: ' + splitted[0] + ' hours ' + splitted[1] + ' minutes ' + ', enabled: ' + data.enabled);

  if (self.haltSchedule != undefined) {
    self.haltSchedule.cancel();
    delete self.haltSchedule;
  }

  if (data.enabled) {
    var actionText;
    var date = new Date(thisMoment.year(), thisMoment.month(), thisMoment.date(), sleephour, sleepminute, 0);
    self.commandRouter.pushConsoleMessage('Set Sleep at ' + date);
    self.haltSchedule = schedule.scheduleJob(date, function () {
      //			config.set('sleep_enabled',false);

      self.haltSchedule.cancel();
      delete self.haltSchedule;

      setTimeout(function () {
        if (data.action == 'stop') {
          self.commandRouter.pushConsoleMessage('Sleep timer expired.');
          self.commandRouter.volumioStop();
          self.getSleepConf().sleep_enabled = false;
        } else {
          console.log('System is shutting down....');
          self.commandRouter.shutdown();
        }
      }, 5000);
    });
    // if (sleepminute >= 60 ) {
    // 	sleephour += 1;
    // 	sleepminute -= 60;
    // }
    // if (sleephour > 23) {
    // 	sleephour = 0;
    // }
    if (sleephour < 10) {
      sleephour = '0' + sleephour;
    }
    if (sleepminute < 10) {
      sleepminute = '0' + sleepminute;
    }
    if (data.action == 'stop') {
      actionText = self.commandRouter.getI18nString('ALARM_PLUS.STOP_MUSIC');
    } else {
      actionText = self.commandRouter.getI18nString('ALARM_PLUS.TURN_OFF');
    }
    if (addedHours == 0) {
      self.commandRouter.pushToastMessage(
        'success',
        self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_TITLE'),
        self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_SYSTEM_WILL') + ' ' +
					actionText + ' ' +
					self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_IN') + ' ' +
					addedMinutes + ' ' +
					self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_MINUTE')
      );
    } else {
      self.commandRouter.pushToastMessage(
        'success',
        self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_TITLE'),
        self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_SYSTEM_WILL') + ' ' +
					actionText + ' ' +
					self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_IN') + ' ' +
					addedHours + ' ' +
					self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_HOUR') +
					addedMinutes + ' ' +
					self.commandRouter.getI18nString('ALARM_PLUS.SLEEP_MODE_MINUTE')
      );
    }
  }

  defer.resolve({});
  return defer.promise;
};
