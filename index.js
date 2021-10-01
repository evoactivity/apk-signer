var fs = require('q-io/fs');
var path = require('path');
var exec = require('child-process-promise').exec;

module.exports = function (config) {
  var unalignedPath = config.output
    ? config.output + '.apk'
    : path.resolve(config.name + '-unaligned.apk');

  // apksigner sign --ks mykeystorefile --ks-key-alias myaliasname myapkfile.apk
  var apksignerCmd = ['apksigner sign'];
  apksignerCmd.push('--ks ' + config.keystore);
  apksignerCmd.push('--ks-pass pass:' + config.storepass);
  apksignerCmd.push('--key-pass pass:' + config.keypass);
  apksignerCmd.push('--ks-key-alias ' + config.alias);
  apksignerCmd.push('--in ' + config.file);
  apksignerCmd.push('--out ' + unalignedPath);

  var zipalignCmd = ['zipalign -f -v 4'];
  zipalignCmd.push(unalignedPath);
  zipalignCmd.push(config.name + '.apk');

  var log = '';
  return exec(apksignerCmd.join(' '), {
    cwd: process.cwd(),
    env: process.env,
    maxBuffer: 1024 * 500
  })
    .then(function (res) {
      if (res.stderr.length > 0) throw stderr;
      log += res.stdout;
    })
    .catch(function (err) {
      console.log('jarsigner failed:', err);
      throw err; // don't swallow; cancel here
    })
    .then(function () {
      return exec(zipalignCmd.join(' '), {
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
      console.log('zipalign failed:', err);
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
