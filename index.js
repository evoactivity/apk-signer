var fs = require('q-io/fs');
var path = require('path');
var exec = require('child-process-promise').exec;

module.exports = function (config) {
  var alignedPath = path.resolve(config.name + '-aligned.apk');

  // apksigner sign --ks mykeystorefile --ks-key-alias myaliasname myapkfile.apk
  var apksignerCmd = ['apksigner sign'];
  apksignerCmd.push('--ks ' + config.keystore);
  apksignerCmd.push('--ks-pass pass:' + config.storepass);
  apksignerCmd.push('--key-pass pass:' + config.keypass);
  apksignerCmd.push('--ks-key-alias ' + config.alias);
  apksignerCmd.push('--in ' + alignedPath);
  apksignerCmd.push('--out ' + config.name + '.apk');

  var zipalignCmd = ['zipalign -f -v 4'];
  zipalignCmd.push(config.file);
  zipalignCmd.push(alignedPath);

  var log = '';

  return exec(zipalignCmd.join(' '), {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 500
  })
    .then(function (res) {
      if (res.stderr.length > 0) throw stderr;
      log += res.stdout;
    })
    .catch(function (err) {
      console.log('zipalign failed:', err);
      throw err; // don't swallow; cancel here
    })
    .then(function () {
      return exec(apksignerCmd.join(' '), {
        cwd: process.cwd(),
        env: process.env,
        maxBuffer: 1024 * 500
      });
    })
    .then(function (res) {
      if (res.stderr.length > 0) throw stderr;
      log += res.stdout;
    })
    .catch(function (err) {
      console.log('apksigner failed:', err);
      throw err; // don't swallow; cancel here
    })
    .then(function () {
      if (config.log) {
        return fs.write(config.log, log).then(function () {
          return fs.read(config.log);
        });
      }
      return true;
    });
};
